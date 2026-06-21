import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWeather } from "@/lib/weather.functions";
import { logActivity } from "@/lib/activity";
import { useGeolocation } from "@/hooks/use-geolocation";
import "@/styles/urban-assist.css";

type PageKey =
  | "dashboard" | "transport" | "tasks" | "bills"
  | "nearby" | "emergency" | "environment" | "settings";

const pageConfig: Record<PageKey, [string, string]> = {
  dashboard: ["Overview", "Good Day"],
  transport: ["Transport", "Live City Transit"],
  tasks: ["Tasks & Goals", "Manage Your Daily Life"],
  bills: ["Bills & Payments", "Track & Pay City Bills"],
  nearby: ["Nearby", "Places Around You"],
  emergency: ["Emergency", "Quick Access to Services"],
  environment: ["Environment", "Weather & Air Quality"],
  settings: ["Settings", "Profile & Preferences"],
};

type DBTask = {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  created_at: string;
};
type UIPri = "High" | "Medium" | "Low";
const toUIPri = (p: string): UIPri =>
  p === "high" ? "High" : p === "low" ? "Low" : "Medium";
const toDBPri = (p: UIPri) => p.toLowerCase();

const priClass = { High: "ph", Medium: "pm", Low: "pl" } as const;
const priLabel = { High: "High", Medium: "Med", Low: "Low" } as const;

let toastTimer: number | undefined;
function showToast(msg: string) {
  const t = document.getElementById("ua-toast");
  const m = document.getElementById("ua-tmsg");
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add("show");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("show"), 3000);
}

type NotifPrefs = {
  billReminders: boolean;
  transportAlerts: boolean;
  aqiWarnings: boolean;
  cityEvents: boolean;
};
const DEFAULT_NOTIFS: NotifPrefs = {
  billReminders: true,
  transportAlerts: true,
  aqiWarnings: false,
  cityEvents: true,
};

export function UrbanAssistApp({ userName }: { userName: string }) {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [transportTab, setTransportTab] = useState<"metro" | "bus" | "cab" | "bike">("metro");
  const [nearbyTab, setNearbyTab] = useState<"food" | "hospital" | "shops" | "govt">("food");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { coords } = useGeolocation({ lat: 13.0827, lng: 80.2707 });
  const fetchWeather = useServerFn(getWeather);

  // ----- USER -----
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? "");
    });
  }, []);

  // ----- TASKS (Supabase) -----
  const tasksQ = useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async (): Promise<DBTask[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,priority,completed,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const tasks = tasksQ.data ?? [];

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPri, setNewTaskPri] = useState<UIPri>("High");

  const addTaskM = useMutation({
    mutationFn: async () => {
      const txt = newTaskText.trim();
      if (!txt || !userId) throw new Error("empty");
      const { error } = await supabase.from("tasks").insert({
        user_id: userId,
        title: txt,
        priority: toDBPri(newTaskPri),
      });
      if (error) throw error;
      await logActivity("task_added", txt, { priority: toDBPri(newTaskPri) });
      return txt;
    },
    onSuccess: (txt) => {
      setNewTaskText("");
      showToast("Task added: " + txt);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (e: Error) => {
      if (e.message !== "empty") showToast("Could not add task");
      else showToast("Please enter a task description");
    },
  });

  const toggleTaskM = useMutation({
    mutationFn: async (t: DBTask) => {
      const next = !t.completed;
      const { error } = await supabase
        .from("tasks")
        .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
      if (next) await logActivity("task_completed", t.title);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const deleteTaskM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showToast("Task removed");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const addTask = () => addTaskM.mutate();
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const doneCount = tasks.filter((t) => t.completed).length;

  // ----- ACTIVITIES -----
  const activitiesQ = useQuery({
    queryKey: ["activities", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id,kind,label,created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
  const activities = activitiesQ.data ?? [];

  // ----- PROFILE -----
  const profileQ = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,city,phone,preferences")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [pfName, setPfName] = useState("");
  const [pfPhone, setPfPhone] = useState("");
  const [pfCity, setPfCity] = useState("");
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS);
  useEffect(() => {
    if (!profileQ.data) return;
    setPfName(profileQ.data.display_name ?? userName);
    setPfPhone(profileQ.data.phone ?? "");
    setPfCity(profileQ.data.city ?? "");
    const prefs = (profileQ.data.preferences ?? {}) as Record<string, unknown>;
    const n = (prefs.notifications ?? {}) as Partial<NotifPrefs>;
    setNotifs({ ...DEFAULT_NOTIFS, ...n });
  }, [profileQ.data, userName]);

  const saveProfileM = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("no user");
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: pfName || null,
        phone: pfPhone || null,
        city: pfCity || null,
        preferences: {
          darkMode: false,
          language: "en",
          notifications: notifs,
        } as never,
      });
      if (error) throw error;
      await logActivity("profile_updated", "Profile saved");
    },
    onSuccess: () => {
      showToast("Profile saved!");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: () => showToast("Could not save profile"),
  });

  const toggleNotif = (k: keyof NotifPrefs) => {
    const next = { ...notifs, [k]: !notifs[k] };
    setNotifs(next);
    if (!userId) return;
    supabase
      .from("profiles")
      .upsert({
        id: userId,
        preferences: {
          darkMode: false,
          language: "en",
          notifications: next,
        } as never,
      })
      .then(({ error }) => {
        if (error) showToast("Could not save preference");
      });
  };

  // ----- WEATHER -----
  const weatherQ = useQuery({
    queryKey: ["weather", coords.lat, coords.lng],
    queryFn: () => fetchWeather({ data: { lat: coords.lat, lng: coords.lng } }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const w = weatherQ.data;
  const weatherEmoji = (icon?: string) => {
    if (!icon) return "🌤️";
    if (icon.startsWith("01")) return "☀️";
    if (icon.startsWith("02")) return "🌤️";
    if (icon.startsWith("03") || icon.startsWith("04")) return "☁️";
    if (icon.startsWith("09") || icon.startsWith("10")) return "🌧️";
    if (icon.startsWith("11")) return "🌩️";
    if (icon.startsWith("13")) return "❄️";
    return "🌫️";
  };

  // ----- BILLS (Supabase) -----
  type DBBill = {
    id: number;
    title: string;
    amount: number;
    due_date: string | null;
    status: string;
    category: string | null;
  };
  type Bill = { id: number; name: string; due: string; amount: string; status: "Due" | "Overdue" | "Paid"; iconBg: string; iconColor: string; icon: string; amountColor?: string };

  const [newBillTitle, setNewBillTitle] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillCat, setNewBillCat] = useState("Electricity");
  const [newBillDate, setNewBillDate] = useState("");

  const [plannerFrom, setPlannerFrom] = useState("");
  const [plannerTo, setPlannerTo] = useState("");

  const billsQ = useQuery({
    queryKey: ["bills", userId],
    enabled: !!userId,
    queryFn: async (): Promise<DBBill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select("id,title,amount,due_date,status,category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const dbBills = billsQ.data ?? [];
  const bills = useMemo((): Bill[] => {
    return dbBills.map((b) => {
      let icon = "fa-file-invoice-dollar";
      let iconBg = "rgba(29,107,107,0.1)";
      let iconColor = "var(--teal)";
      let amountColor = undefined;

      const cat = (b.category || "").toLowerCase();
      if (cat.includes("electricity") || cat.includes("power") || cat.includes("bolt")) {
        icon = "fa-bolt";
        iconBg = "rgba(197,155,46,0.12)";
        iconColor = "var(--gold)";
        amountColor = "var(--gold)";
      } else if (cat.includes("water") || cat.includes("tint")) {
        icon = "fa-tint";
        iconBg = "rgba(192,86,42,0.1)";
        iconColor = "var(--terra)";
        amountColor = "var(--terra)";
      } else if (cat.includes("phone") || cat.includes("mobile") || cat.includes("jio") || cat.includes("airtel")) {
        icon = "fa-mobile-alt";
        iconBg = "rgba(29,107,107,0.1)";
        iconColor = "var(--teal)";
        amountColor = "var(--gold)";
      } else if (cat.includes("home") || cat.includes("maintenance") || cat.includes("society")) {
        icon = "fa-home";
        iconBg = "rgba(29,107,107,0.1)";
        iconColor = "var(--teal)";
      } else if (cat.includes("wifi") || cat.includes("broadband") || cat.includes("internet") || cat.includes("bsnl")) {
        icon = "fa-wifi";
        iconBg = "rgba(192,86,42,0.08)";
        iconColor = "var(--terra2)";
      }

      let dueStr = "";
      if (b.status === "Paid") {
        dueStr = b.due_date ? `Paid on: ${new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Paid";
      } else {
        dueStr = b.due_date ? `Due: ${new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Pending";
      }

      let uiStatus: "Due" | "Overdue" | "Paid" = "Due";
      if (b.status === "Paid") uiStatus = "Paid";
      else if (b.status === "Overdue" || b.status === "Overdued") uiStatus = "Overdue";

      return {
        id: Number(b.id),
        name: b.title,
        due: dueStr,
        amount: `₹${Number(b.amount).toLocaleString('en-IN')}`,
        status: uiStatus,
        iconBg,
        iconColor,
        icon,
        amountColor
      };
    });
  }, [dbBills]);

  const addBillM = useMutation({
    mutationFn: async () => {
      const title = newBillTitle.trim();
      const amountNum = parseFloat(newBillAmount);
      if (!title || isNaN(amountNum) || !userId) throw new Error("empty");
      
      const { error } = await supabase.from("bills").insert({
        user_id: userId,
        title,
        amount: amountNum,
        due_date: newBillDate || null,
        status: "Pending",
        category: newBillCat
      });
      if (error) throw error;
      await logActivity("bill_added", `${title} (₹${amountNum})`);
    },
    onSuccess: () => {
      setNewBillTitle("");
      setNewBillAmount("");
      setNewBillDate("");
      showToast("Bill added successfully!");
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (e: Error) => {
      if (e.message === "empty") showToast("Please fill all required fields");
      else showToast("Could not add bill");
    }
  });

  const addBill = () => addBillM.mutate();

  const payBillM = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { error } = await supabase
        .from("bills")
        .update({ status: "Paid" })
        .eq("id", id);
      if (error) throw error;
      await logActivity("bill_paid", name);
    },
    onSuccess: (_, { name }) => {
      showToast("Payment for " + name + " initiated!");
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: () => {
      showToast("Could not complete payment");
    }
  });

  // ----- TRANSPORT ROUTES (Supabase) -----
  type DBRoute = {
    id: number;
    route_name: string;
    vehicle_type: string | null;
    departure_time: string | null;
    arrival_time: string | null;
    source: string | null;
    destination: string | null;
    fare: number | null;
  };

  const routesQ = useQuery({
    queryKey: ["transport_routes", userId],
    enabled: !!userId,
    queryFn: async (): Promise<DBRoute[]> => {
      const { data, error } = await supabase
        .from("transport_routes")
        .select("id,route_name,vehicle_type,departure_time,arrival_time,source,destination,fare");
      if (error) throw error;
      return data ?? [];
    }
  });
  const transportRoutes = routesQ.data ?? [];

  const handlePlanRoute = () => {
    const from = plannerFrom.trim().toLowerCase();
    const to = plannerTo.trim().toLowerCase();
    if (!from || !to) {
      showToast("Please enter both From and To locations.");
      return;
    }

    const match = transportRoutes.find(r => 
      ((r.source || "").toLowerCase().includes(from) || from.includes((r.source || "").toLowerCase())) &&
      ((r.destination || "").toLowerCase().includes(to) || to.includes((r.destination || "").toLowerCase()))
    );

    if (match) {
      showToast(`Route found: ${match.route_name} (${match.vehicle_type}) from ${match.source} to ${match.destination}. Fare: ₹${match.fare}. Duration: ~15 mins.`);
    } else {
      showToast(`No direct route found from "${plannerFrom}" to "${plannerTo}". Try "Ambattur" to "Broadway".`);
    }
  };

  // ----- NEARBY POIS (Overpass API) -----
  type POI = { name: string; category: string; rating: string; dist: string; type: string; phone?: string; lat?: number; lng?: number };
  
  const getPOIQuery = (tab: typeof nearbyTab, lat: number, lng: number) => {
    let query = "";
    if (tab === "food") {
      query = `[out:json];node(around:3000,${lat},${lng})[amenity=restaurant];out 12;`;
    } else if (tab === "hospital") {
      query = `[out:json];node(around:3000,${lat},${lng})[amenity~"hospital|clinic|doctors"];out 12;`;
    } else if (tab === "shops") {
      query = `[out:json];node(around:3000,${lat},${lng})[shop~"supermarket|convenience|department_store|chemist|pharmacy"];out 12;`;
    } else if (tab === "govt") {
      query = `[out:json];node(around:3000,${lat},${lng})[amenity~"townhall|police|post_office"];out 12;`;
    }
    return query;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const poisQ = useQuery({
    queryKey: ["nearby_pois", nearbyTab, coords.lat, coords.lng],
    queryFn: async (): Promise<POI[]> => {
      const q = getPOIQuery(nearbyTab, coords.lat, coords.lng);
      if (!q) return [];
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("POI lookup failed");
      const data = await res.json();
      
      const elements = data.elements ?? [];
      const results = elements.map((el: any) => {
        const name = el.tags?.name || "Local Outlet";
        const d = calculateDistance(coords.lat, coords.lng, el.lat, el.lon);
        
        let rating = "★ 4.2";
        if (el.id) {
          const r = 4.0 + (el.id % 10) * 0.1;
          rating = `★ ${r.toFixed(1)}`;
        }

        let category = "Local Place";
        if (nearbyTab === "food") {
          category = el.tags?.cuisine ? `${el.tags.cuisine.charAt(0).toUpperCase()}${el.tags.cuisine.slice(1)} Cuisine` : "Multi-Cuisine Restaurant";
        } else if (nearbyTab === "hospital") {
          category = el.tags?.amenity === "hospital" ? "General Hospital" : "Medical Clinic";
        } else if (nearbyTab === "shops") {
          category = el.tags?.shop === "supermarket" ? "Supermarket" : el.tags?.amenity === "pharmacy" ? "Pharmacy" : "Grocery Shop";
        } else if (nearbyTab === "govt") {
          category = el.tags?.amenity === "police" ? "Police Station" : el.tags?.amenity === "post_office" ? "Post Office" : "Government Building";
        }

        return {
          name,
          category,
          rating,
          dist: `${d.toFixed(1)} km`,
          type: el.tags?.amenity || el.tags?.shop || "amenity",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "+91 44 2432 0000",
          lat: el.lat,
          lng: el.lon
        };
      });

      return results;
    },
    staleTime: 5 * 60 * 1000
  });

  const rawPois = poisQ.data ?? [];
  
  const pois = useMemo((): POI[] => {
    if (rawPois.length > 0) return rawPois;
    
    if (nearbyTab === "food") {
      return [
        { name: "Saravana Bhavan", category: "South Indian · Veg", rating: "★ 4.5", dist: "0.8 km", type: "restaurant", phone: "+91 44 2829 3333" },
        { name: "Murugan Idli Shop", category: "Tiffin · Breakfast", rating: "★ 4.7", dist: "1.2 km", type: "restaurant", phone: "+91 44 4242 4242" },
        { name: "Anjappar Chettinad", category: "Chettinad · Non-Veg", rating: "★ 4.3", dist: "2.1 km", type: "restaurant", phone: "+91 44 2432 0000" },
        { name: "Junior Kuppanna", category: "Kongu Cuisine", rating: "★ 4.6", dist: "3.0 km", type: "restaurant", phone: "+91 44 2626 1234" },
      ];
    } else if (nearbyTab === "hospital") {
      return [
        { name: "Government Royapettah Hospital", category: "General Hospital · Open 24x7", rating: "★ 4.1", dist: "2.3 km", type: "hospital", phone: "+91 44 2829 3333" },
        { name: "Fortis Malar Hospital", category: "Private · ICU Available", rating: "★ 4.2", dist: "5.1 km", type: "hospital", phone: "+91 44 4242 4242" },
        { name: "Ambattur Primary Health Centre", category: "Public · 9am - 5pm", rating: "★ 4.3", dist: "0.5 km", type: "hospital", phone: "+91 44 2626 1234" },
      ];
    } else if (nearbyTab === "shops") {
      return [
        { name: "Ambattur Super Market", category: "Grocery · Open until 10pm", rating: "★ 4.4", dist: "0.3 km", type: "shop" },
        { name: "MedPlus Pharmacy", category: "Medicine · Open 24x7", rating: "★ 4.5", dist: "0.7 km", type: "shop" },
        { name: "District Central Library", category: "Books · 10am - 7pm", rating: "★ 4.6", dist: "1.4 km", type: "shop" },
      ];
    } else {
      return [
        { name: "Ambattur Taluk Office", category: "Land records, certificates", rating: "★ 4.0", dist: "0.9 km", type: "govt" },
        { name: "Regional Passport Office", category: "Passport · Appointment required", rating: "★ 4.2", dist: "6.2 km", type: "govt" },
        { name: "Ambattur Police Station", category: "Law Enforcement · 24x7", rating: "★ 4.5", dist: "0.6 km", type: "govt" },
      ];
    }
  }, [rawPois, nearbyTab]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { pages: [], tasks: [], bills: [], places: [] };

    const matchedPages = (Object.keys(pageConfig) as PageKey[]).filter(k => 
      pageConfig[k][0].toLowerCase().includes(q) || 
      pageConfig[k][1].toLowerCase().includes(q) || 
      k.toLowerCase().includes(q)
    );

    const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(q));
    const matchedBills = bills.filter(b => b.name.toLowerCase().includes(q));
    const matchedPlaces = pois.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

    return {
      pages: matchedPages,
      tasks: matchedTasks,
      bills: matchedBills,
      places: matchedPlaces
    };
  }, [searchQuery, tasks, bills, pois]);

  // ----- SOS -----
  const [sosMsg, setSosMsg] = useState("");
  const sendSOS = async () => {
    await logActivity("sos_alert", sosMsg || "SOS alert sent", {
      lat: coords.lat,
      lng: coords.lng,
    });
    showToast("SOS Alert sent with your location!");
    setSosMsg("");
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  // ----- UI HELPERS -----
  const initials = (pfName || userName || "U").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const firstName = (pfName || userName || "Friend").split(" ")[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  }, []);

  const eyebrow = pageConfig[page][0];
  const heading = page === "dashboard" ? `${greeting}, ${firstName} ☀️` : pageConfig[page][1];

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const NavItem = ({ k, icon, label, badge }: { k: PageKey; icon: string; label: string; badge?: { cls: string; text: string } }) => (
    <div className={`nav-item ${page === k ? "active" : ""}`} onClick={() => setPage(k)}>
      <span className="ni"><i className={`fas ${icon}`}></i></span>{label}
      {badge && <span className={`nb ${badge.cls}`}>{badge.text}</span>}
    </div>
  );

  const Tab = <T extends string>({ id, current, setCurrent, label }: { id: T; current: T; setCurrent: (v: T) => void; label: string }) => (
    <div className={`tab-btn ${current === id ? "active" : ""}`} onClick={() => setCurrent(id)}>{label}</div>
  );

  const billsDue = bills.filter(b => b.status !== "Paid").length;
  const billsDueAmount = bills.filter(b => b.status !== "Paid").reduce((s, b) => s + parseInt(b.amount.replace(/[^\d]/g, "")), 0);

  const fmtTimeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  };
  const activityIcon = (kind: string) => {
    if (kind.startsWith("task_completed")) return "fa-check-circle";
    if (kind.startsWith("task_added")) return "fa-plus-circle";
    if (kind.startsWith("bill_paid")) return "fa-wallet";
    if (kind.startsWith("sos")) return "fa-satellite-dish";
    if (kind.startsWith("profile")) return "fa-user-edit";
    return "fa-bolt";
  };

  return (
    <div className="ua-root">
      <div id="ua-toast" className="ua-toast"><i className="fas fa-check-circle"></i><span id="ua-tmsg">Done</span></div>

      <div className="app">
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="logo-wordmark">Urban<em>Assist</em></div>
            <div className="logo-tagline">Smart City Life Manager</div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section-label">Overview</div>
            <NavItem k="dashboard" icon="fa-th-large" label="Dashboard" />
            <NavItem k="transport" icon="fa-subway" label="Transport" />
            <NavItem k="tasks" icon="fa-tasks" label="Tasks & Goals" badge={{ cls: "nb-gold", text: String(pendingCount) }} />
            <NavItem k="bills" icon="fa-file-invoice-dollar" label="Bills & Payments" badge={{ cls: "nb-red", text: String(billsDue) }} />
            <div className="sb-section-label">City Services</div>
            <NavItem k="nearby" icon="fa-map-marker-alt" label="Nearby" />
            <NavItem k="emergency" icon="fa-phone-alt" label="Emergency" badge={{ cls: "nb-red", text: "!" }} />
            <NavItem k="environment" icon="fa-leaf" label="Environment" badge={{ cls: "nb-teal", text: "Good" }} />
            <div className="sb-section-label">Account</div>
            <NavItem k="settings" icon="fa-cog" label="Settings" />
          </nav>
          <div className="sb-footer">
            <div className="user-row" onClick={signOut} title="Sign out">
              <div className="ava">{initials}</div>
              <div>
                <div className="user-name">{pfName || userName}</div>
                <div className="user-plan">✦ Premium Member</div>
              </div>
              <i className="fas fa-sign-out-alt" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginLeft: "auto" }}></i>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="page-eyebrow">{eyebrow}</div>
              <div className="page-heading">{heading}</div>
            </div>
            <div className="topbar-right">
              <div className="search-wrap" style={{ position: "relative" }}>
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search city services..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery.trim() !== "" && (
                  <div
                    className="search-dropdown"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      width: "320px",
                      background: "var(--white)",
                      border: "1px solid var(--border2)",
                      borderRadius: "var(--r2)",
                      boxShadow: "var(--shadow2)",
                      marginTop: "8px",
                      padding: "16px",
                      zIndex: 1000,
                      maxHeight: "360px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--terra)", letterSpacing: "1px", textTransform: "uppercase" }}>Search Results</div>
                    
                    {/* Pages/Services */}
                    {searchResults.pages.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink4)", marginBottom: "4px" }}>Services</div>
                        {searchResults.pages.map(pKey => (
                          <div
                            key={pKey}
                            onClick={() => { setPage(pKey); setSearchQuery(""); }}
                            style={{ padding: "6px 8px", borderRadius: "var(--r)", cursor: "pointer", fontSize: "12.5px", background: "rgba(192,86,42,0.05)", marginBottom: "4px" }}
                          >
                            <strong>{pageConfig[pKey][0]}</strong> - {pageConfig[pKey][1]}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink4)", marginBottom: "4px" }}>Tasks</div>
                        {searchResults.tasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => { toggleTaskM.mutate(t); setSearchQuery(""); }}
                            style={{ padding: "6px 8px", borderRadius: "var(--r)", cursor: "pointer", fontSize: "12px", background: "rgba(29,107,107,0.05)", marginBottom: "4px", textDecoration: t.completed ? "line-through" : "none" }}
                          >
                            {t.title} ({toUIPri(t.priority)})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bills */}
                    {searchResults.bills.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink4)", marginBottom: "4px" }}>Bills</div>
                        {searchResults.bills.map(b => (
                          <div
                            key={b.id}
                            onClick={() => { setPage("bills"); setSearchQuery(""); }}
                            style={{ padding: "6px 8px", borderRadius: "var(--r)", cursor: "pointer", fontSize: "12px", background: "rgba(197,155,46,0.05)", marginBottom: "4px" }}
                          >
                            {b.name} - {b.amount} ({b.status})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Places */}
                    {searchResults.places.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink4)", marginBottom: "4px" }}>Nearby Places</div>
                        {searchResults.places.map((place, idx) => (
                          <div
                            key={idx}
                            onClick={() => { 
                              setPage("nearby"); 
                              setNearbyTab(
                                place.type === "hospital" || place.type === "clinic" ? "hospital" : 
                                place.type === "police" || place.type === "post_office" || place.type === "townhall" ? "govt" : 
                                place.type === "supermarket" || place.type === "pharmacy" || place.type.includes("shop") ? "shops" : "food"
                              ); 
                              setSearchQuery(""); 
                            }}
                            style={{ padding: "6px 8px", borderRadius: "var(--r)", cursor: "pointer", fontSize: "12px", background: "rgba(30,24,16,0.03)", marginBottom: "4px" }}
                          >
                            <strong>{place.name}</strong> - {place.category} ({place.dist})
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.pages.length === 0 && searchResults.tasks.length === 0 && searchResults.bills.length === 0 && searchResults.places.length === 0 && (
                      <div style={{ fontSize: "12px", color: "var(--ink4)", textAlign: "center", padding: "12px 0" }}>No matching results found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="tb-btn" onClick={() => showToast(activities.length ? `${activities.length} recent activities` : "No new notifications")}>
                <i className="fas fa-bell"></i><span className="ndot"></span>
              </div>
              <div className="tb-btn" onClick={() => showToast(w ? `Location: ${w.city}` : "Detecting location...")}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
            </div>
          </div>

          <div className="page-body">

            {/* DASHBOARD */}
            <div className={`page ${page === "dashboard" ? "active" : ""}`}>
              <div className="ornament"><div className="ornament-line"></div><div className="ornament-diamond"></div><div className="ornament-line"></div></div>
              <div className="stats-row">
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--terra)" }}></div><div className="scard-icon" style={{ background: "rgba(192,86,42,0.1)", color: "var(--terra)" }}><i className="fas fa-tasks"></i></div><div className="scard-label">Tasks Pending</div><div className="scard-value">{pendingCount}</div><div className="scard-sub up">↑ {doneCount} completed</div></div>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--teal)" }}></div><div className="scard-icon" style={{ background: "rgba(29,107,107,0.1)", color: "var(--teal)" }}><i className="fas fa-leaf"></i></div><div className="scard-label">Air Quality</div><div className="scard-value">42</div><div className="scard-sub up">Good · PM2.5</div></div>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--terra)" }}></div><div className="scard-icon" style={{ background: "rgba(192,86,42,0.1)", color: "var(--terra)" }}><i className="fas fa-file-invoice-dollar"></i></div><div className="scard-label">Bills Due</div><div className="scard-value">₹{billsDueAmount.toLocaleString()}</div><div className="scard-sub dn">↑ {billsDue} pending</div></div>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--gold)" }}></div><div className="scard-icon" style={{ background: "rgba(197,155,46,0.12)", color: "var(--gold)" }}><i className="fas fa-cloud-sun"></i></div><div className="scard-label">Weather</div><div className="scard-value">{w ? `${w.temp}°C` : "—"}</div><div className="scard-sub">{w ? w.description : "Loading..."}</div></div>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <div className="ch"><div className="ct">Quick Actions</div></div>
                <div className="qa-grid">
                  <div className="qa-btn" onClick={() => setPage("transport")}><i className="fas fa-subway" style={{ color: "var(--terra)" }}></i><span>Transport</span></div>
                  <div className="qa-btn" onClick={() => setPage("bills")}><i className="fas fa-wallet" style={{ color: "var(--teal)" }}></i><span>Pay Bills</span></div>
                  <div className="qa-btn" onClick={() => setPage("nearby")}><i className="fas fa-utensils" style={{ color: "var(--gold)" }}></i><span>Food Nearby</span></div>
                  <div className="qa-btn" onClick={() => setPage("emergency")}><i className="fas fa-phone-alt" style={{ color: "var(--terra)" }}></i><span>Emergency</span></div>
                  <div className="qa-btn" onClick={() => setPage("environment")}><i className="fas fa-cloud-sun" style={{ color: "var(--teal)" }}></i><span>Weather</span></div>
                  <div className="qa-btn" onClick={() => setPage("tasks")}><i className="fas fa-check-double" style={{ color: "var(--gold)" }}></i><span>My Tasks</span></div>
                  <div className="qa-btn" onClick={() => { setPage("nearby"); setNearbyTab("hospital"); }}><i className="fas fa-hospital" style={{ color: "var(--terra2)" }}></i><span>Hospital</span></div>
                  <div className="qa-btn" onClick={() => { setPage("nearby"); setNearbyTab("govt"); }}><i className="fas fa-landmark" style={{ color: "var(--teal2)" }}></i><span>Gov. Services</span></div>
                </div>
              </div>

              <div className="g31">
                <div className="card">
                  <div className="ch"><div className="ct">Today's Tasks</div><div className="ca" onClick={() => setPage("tasks")}>View all</div></div>
                  {tasksQ.isLoading && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Loading…</div>}
                  {!tasksQ.isLoading && tasks.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No tasks yet. Add one from the Tasks page.</div>}
                  {tasks.slice(0, 4).map(t => {
                    const pri = toUIPri(t.priority);
                    return (
                      <div key={t.id} className={`task-item ${t.completed ? "done" : ""}`} onClick={() => toggleTaskM.mutate(t)}>
                        <div className={`tchk ${t.completed ? "on" : ""}`}>{t.completed && <i className="fas fa-check"></i>}</div>
                        <div className="task-txt">{t.title}</div>
                        <div className={`tpri ${priClass[pri]}`}>{t.completed ? "Done" : priLabel[pri]}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="card">
                  <div className="ch"><div className="ct">Recent Activity</div></div>
                  {activitiesQ.isLoading && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Loading…</div>}
                  {!activitiesQ.isLoading && activities.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No activity yet — try adding a task.</div>}
                  {activities.map(a => (
                    <div key={a.id} className="ev-item">
                      <div className="ev-date" style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className={`fas ${activityIcon(a.kind)}`} style={{ color: "var(--teal)" }}></i>
                      </div>
                      <div>
                        <div className="ev-name">{a.label}</div>
                        <div className="ev-loc">{fmtTimeAgo(a.created_at)}</div>
                        <div className="ev-tag">{a.kind.replace(/_/g, " ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="g2">
                <div className="card">
                  <div className="ch"><div className="ct">Weather — {w?.city ?? "—"}</div><div className="chip teal"><i className="fas fa-circle" style={{ fontSize: 8 }}></i> Live</div></div>
                  <div className="wx-hero">
                    <div className="wx-emoji">{weatherEmoji(w?.icon)}</div>
                    <div>
                      <div className="wx-temp">{w ? `${w.temp}°C` : "—"}</div>
                      <div className="wx-desc">{w?.description ?? "Loading..."}</div>
                      <div className="wx-city">{w ? `${w.city}${w.country ? ", " + w.country : ""}` : "Detecting..."}</div>
                    </div>
                  </div>
                  <div className="wx-details">
                    <div className="wd"><div className="wd-i"><i className="fas fa-tint"></i></div><div className="wd-v">{w?.humidity ?? "—"}%</div><div className="wd-l">Humidity</div></div>
                    <div className="wd"><div className="wd-i"><i className="fas fa-wind"></i></div><div className="wd-v">{w?.wind ?? "—"} km/h</div><div className="wd-l">Wind</div></div>
                    <div className="wd"><div className="wd-i"><i className="fas fa-thermometer-half"></i></div><div className="wd-v">{w?.feelsLike ?? "—"}°</div><div className="wd-l">Feels Like</div></div>
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><div className="ct">My Progress</div><div className="ca">Weekly</div></div>
                  {[
                    ["Daily Tasks", `${doneCount} / ${tasks.length || 1}`, `${Math.round((doneCount / Math.max(tasks.length, 1)) * 100)}%`, "var(--terra)"],
                    ["Bills Paid", `${bills.filter(b => b.status === "Paid").length} / ${bills.length}`, `${Math.round((bills.filter(b => b.status === "Paid").length / bills.length) * 100)}%`, "var(--teal)"],
                    ["Civic Engagement", "3 / 5", "60%", "var(--gold)"],
                    ["Budget Used", "₹18k / ₹30k", "60%", "var(--terra2)"],
                    ["Health Goals", "4 / 5", "80%", "var(--teal2)"],
                  ].map(([a, b, wd, c], i) => (
                    <div key={i} className="prog-row"><div className="prog-lbl"><span>{a}</span><span>{b}</span></div><div className="prog-bg"><div className="prog-fill" style={{ width: wd, background: c }}></div></div></div>
                  ))}
                </div>
              </div>
            </div>

            {/* TRANSPORT */}
            <div className={`page ${page === "transport" ? "active" : ""}`}>
              <div className="tab-row">
                <Tab id="metro" current={transportTab} setCurrent={setTransportTab} label="Metro" />
                <Tab id="bus" current={transportTab} setCurrent={setTransportTab} label="Bus" />
                <Tab id="cab" current={transportTab} setCurrent={setTransportTab} label="Cab / Auto" />
                <Tab id="bike" current={transportTab} setCurrent={setTransportTab} label="Bike Share" />
              </div>

              {transportTab === "metro" && (
                <>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="ch"><div className="ct">Journey Planner</div></div>
                    <div className="input-row">
                      <input 
                        className="ua-input" 
                        placeholder="📍 From: e.g. Ambattur" 
                        value={plannerFrom}
                        onChange={(e) => setPlannerFrom(e.target.value)}
                      />
                      <input 
                        className="ua-input" 
                        placeholder="🏁 To: e.g. Broadway" 
                        value={plannerTo}
                        onChange={(e) => setPlannerTo(e.target.value)}
                      />
                      <button className="btn" onClick={handlePlanRoute}>Plan Route</button>
                    </div>
                  </div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="ch"><div className="ct">Live Metro Status</div><div className="chip teal"><i className="fas fa-circle" style={{ fontSize: 8 }}></i> Live</div></div>
                    {routesQ.isLoading && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Loading transit routes…</div>}
                    {!routesQ.isLoading && transportRoutes.filter(r => (r.vehicle_type || "").toLowerCase().includes("metro")).length === 0 && (
                      <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No metro routes found.</div>
                    )}
                    {transportRoutes.filter(r => (r.vehicle_type || "").toLowerCase().includes("metro")).map((r, i) => (
                      <div key={r.id} className="tr-item">
                        <div className="tr-icon ti-metro"><i className="fas fa-subway"></i></div>
                        <div style={{ flex: 1 }}>
                          <div className="tr-name">{r.route_name} · {r.source} → {r.destination}</div>
                          <div className="tr-detail">Platform {i % 2 === 0 ? "1" : "2"} · Fare: ₹{r.fare}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="tr-eta">{i % 2 === 0 ? "3 min" : "7 min"}</div>
                          <div className="tr-status">On time</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="map-ph"><div className="map-dot"></div><i className="fas fa-map"></i><p>Live Metro Map — Chennai CMRL</p></div>
                </>
              )}
              {transportTab === "bus" && (
                <div className="card">
                  <div className="ch"><div className="ct">Nearby Bus Routes</div></div>
                  {routesQ.isLoading && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Loading transit routes…</div>}
                  {!routesQ.isLoading && transportRoutes.filter(r => (r.vehicle_type || "").toLowerCase().includes("bus")).length === 0 && (
                    <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No bus routes found.</div>
                  )}
                  {transportRoutes.filter(r => (r.vehicle_type || "").toLowerCase().includes("bus")).map((r, i) => (
                    <div key={r.id} className="tr-item">
                      <div className="tr-icon ti-bus"><i className="fas fa-bus"></i></div>
                      <div style={{ flex: 1 }}>
                        <div className="tr-name">{r.route_name} · {r.source} → {r.destination}</div>
                        <div className="tr-detail">Fare: ₹{r.fare} • Regular route</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="tr-eta">{i % 2 === 0 ? "6 min" : "11 min"}</div>
                        <div className="tr-status">On time</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {transportTab === "cab" && (
                <div className="card">
                  <div className="ch"><div className="ct">Cab & Auto Options</div></div>
                  <div className="tr-item"><div className="tr-icon ti-cab"><i className="fas fa-taxi"></i></div><div style={{ flex: 1 }}><div className="tr-name">Auto Rickshaw (Nearby)</div><div className="tr-detail">3 autos within 500m · Meter fare</div></div><div style={{ textAlign: "right" }}><div className="tr-eta">2 min</div><div className="tr-status">₹12/km</div></div></div>
                  <div className="tr-item"><div className="tr-icon ti-cab"><i className="fas fa-car"></i></div><div style={{ flex: 1 }}><div className="tr-name">City Cab Express</div><div className="tr-detail">AC Sedan · 4 seats</div></div><div style={{ textAlign: "right" }}><div className="tr-eta">5 min</div><div className="tr-status">₹18/km</div></div></div>
                  <div className="tr-item"><div className="tr-icon ti-cab"><i className="fas fa-car-side"></i></div><div style={{ flex: 1 }}><div className="tr-name">Shared Cab Pool</div><div className="tr-detail">2 co-passengers · Koyambedu</div></div><div style={{ textAlign: "right" }}><div className="tr-eta">8 min</div><div className="tr-status">₹9/km</div></div></div>
                  <button className="btn" style={{ width: "100%", marginTop: 12 }} onClick={() => showToast("Booking auto near you...")}>Book Nearest Auto</button>
                </div>
              )}
              {transportTab === "bike" && (
                <div className="card">
                  <div className="ch"><div className="ct">Cycle & Bike Share</div></div>
                  <div className="tr-item"><div className="tr-icon ti-bike"><i className="fas fa-bicycle"></i></div><div style={{ flex: 1 }}><div className="tr-name">Smart Cycle Station A4</div><div className="tr-detail">Ambattur Estate · 8 bikes</div></div><div style={{ textAlign: "right" }}><div className="tr-eta">350m</div><div className="tr-status">₹5/30min</div></div></div>
                  <div className="tr-item"><div className="tr-icon ti-bike"><i className="fas fa-motorcycle"></i></div><div style={{ flex: 1 }}><div className="tr-name">Electric Scooter Hub</div><div className="tr-detail">MTH Road · 12 scooters · Charged</div></div><div style={{ textAlign: "right" }}><div className="tr-eta">600m</div><div className="tr-status">₹1.5/min</div></div></div>
                </div>
              )}
            </div>

            {/* TASKS */}
            <div className={`page ${page === "tasks" ? "active" : ""}`}>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><div className="ct">Add New Task</div></div>
                <div className="input-row">
                  <input className="ua-input" placeholder="Enter task description..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} />
                  <select className="ua-input" style={{ maxWidth: 120 }} value={newTaskPri} onChange={e => setNewTaskPri(e.target.value as UIPri)}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                  <button className="btn" onClick={addTask} disabled={addTaskM.isPending}>+ Add Task</button>
                </div>
              </div>
              <div className="g2">
                <div className="card">
                  <div className="ch"><div className="ct">Pending Tasks</div><span className="chip">{pendingCount} pending</span></div>
                  {tasksQ.isLoading && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Loading…</div>}
                  {!tasksQ.isLoading && pendingCount === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>All clear ✨</div>}
                  {tasks.filter(t => !t.completed).map(t => {
                    const pri = toUIPri(t.priority);
                    return (
                      <div key={t.id} className="task-item" style={{ display: "flex", alignItems: "center" }}>
                        <div className="tchk" onClick={() => toggleTaskM.mutate(t)}></div>
                        <div className="task-txt" onClick={() => toggleTaskM.mutate(t)} style={{ flex: 1, cursor: "pointer" }}>{t.title}</div>
                        <div className={`tpri ${priClass[pri]}`}>{priLabel[pri]}</div>
                        <i className="fas fa-times" style={{ marginLeft: 10, color: "var(--ink5)", cursor: "pointer", fontSize: 12 }} onClick={() => deleteTaskM.mutate(t.id)}></i>
                      </div>
                    );
                  })}
                </div>
                <div className="card">
                  <div className="ch"><div className="ct">Completed</div></div>
                  {doneCount === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>Nothing completed yet.</div>}
                  {tasks.filter(t => t.completed).map(t => (
                    <div key={t.id} className="task-item done" style={{ display: "flex", alignItems: "center" }}>
                      <div className="tchk on" onClick={() => toggleTaskM.mutate(t)}><i className="fas fa-check"></i></div>
                      <div className="task-txt" style={{ flex: 1, cursor: "pointer" }} onClick={() => toggleTaskM.mutate(t)}>{t.title}</div>
                      <div className="tpri pl">Done</div>
                      <i className="fas fa-times" style={{ marginLeft: 10, color: "var(--ink5)", cursor: "pointer", fontSize: 12 }} onClick={() => deleteTaskM.mutate(t.id)}></i>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BILLS */}
            <div className={`page ${page === "bills" ? "active" : ""}`}>
              <div className="stats-row" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 20 }}>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--teal)" }}></div><div className="scard-icon" style={{ background: "rgba(29,107,107,0.1)", color: "var(--teal)" }}><i className="fas fa-check-circle"></i></div><div className="scard-label">Paid This Month</div><div className="scard-value">₹{bills.filter(b => b.status === "Paid").reduce((s, b) => s + parseFloat(b.amount.replace(/[^\d]/g, "")), 0).toLocaleString('en-IN')}</div><div className="scard-sub up">{bills.filter(b => b.status === "Paid").length} bills paid</div></div>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--gold)" }}></div><div className="scard-icon" style={{ background: "rgba(197,155,46,0.12)", color: "var(--gold)" }}><i className="fas fa-clock"></i></div><div className="scard-label">Due Soon</div><div className="scard-value">₹{billsDueAmount.toLocaleString('en-IN')}</div><div className="scard-sub dn">{billsDue} bills pending</div></div>
                <div className="scard"><div className="scard-stripe" style={{ background: "var(--terra)" }}></div><div className="scard-icon" style={{ background: "rgba(192,86,42,0.1)", color: "var(--terra)" }}><i className="fas fa-exclamation-circle"></i></div><div className="scard-label">Overdue</div><div className="scard-value">₹{bills.filter(b => b.status === "Overdue").reduce((s, b) => s + parseFloat(b.amount.replace(/[^\d]/g, "")), 0).toLocaleString('en-IN')}</div><div className="scard-sub dn">{bills.filter(b => b.status === "Overdue").length} bill overdue</div></div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><div className="ct">Add New Bill</div></div>
                <div className="input-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input 
                    className="ua-input" 
                    placeholder="Bill title (e.g. Water Bill)..." 
                    value={newBillTitle} 
                    onChange={e => setNewBillTitle(e.target.value)} 
                    style={{ flex: 2, minWidth: 200 }}
                  />
                  <input 
                    className="ua-input" 
                    type="number"
                    placeholder="Amount (₹)..." 
                    value={newBillAmount} 
                    onChange={e => setNewBillAmount(e.target.value)} 
                    style={{ flex: 1, minWidth: 100 }}
                  />
                  <select 
                    className="ua-input" 
                    value={newBillCat} 
                    onChange={e => setNewBillCat(e.target.value)}
                    style={{ flex: 1, minWidth: 120 }}
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Home">Home</option>
                    <option value="Wifi">Wifi</option>
                    <option value="Other">Other</option>
                  </select>
                  <input 
                    className="ua-input" 
                    type="date"
                    value={newBillDate} 
                    onChange={e => setNewBillDate(e.target.value)} 
                    style={{ flex: 1, minWidth: 130 }}
                  />
                  <button className="btn" onClick={addBill} disabled={addBillM.isPending}>+ Add Bill</button>
                </div>
              </div>

              <div className="card">
                <div className="ch"><div className="ct">All Bills</div></div>
                {bills.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No bills found. Add one above!</div>}
                {bills.map(b => {
                  const statusClass = b.status === "Paid" ? "sp" : b.status === "Overdue" ? "so" : "sd";
                  return (
                    <div key={b.id} className="bill-item" style={b.status === "Paid" ? { opacity: 0.5 } : undefined}>
                      <div className="bi-icon" style={{ background: b.iconBg, color: b.iconColor }}><i className={`fas ${b.icon}`}></i></div>
                      <div style={{ flex: 1 }}><div className="bi-name">{b.name}</div><div className="bi-due">{b.due}</div></div>
                      <div style={{ textAlign: "right" }}>
                        <div className="bi-amount" style={b.amountColor && b.status !== "Paid" ? { color: b.amountColor } : undefined}>{b.amount}</div>
                        <div className={`bi-status ${statusClass}`}>{b.status}</div>
                      </div>
                      {b.status !== "Paid" && (
                        <button className="btn" style={{ marginLeft: 12, padding: "8px 14px", fontSize: 12, background: b.status === "Overdue" ? "var(--terra)" : undefined }} onClick={() => payBill(b.id, b.name)}>
                          {b.status === "Overdue" ? "Pay Now" : "Pay"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NEARBY */}
            <div className={`page ${page === "nearby" ? "active" : ""}`}>
              <div className="tab-row">
                <Tab id="food" current={nearbyTab} setCurrent={setNearbyTab} label="Food" />
                <Tab id="hospital" current={nearbyTab} setCurrent={setNearbyTab} label="Hospitals" />
                <Tab id="shops" current={nearbyTab} setCurrent={setNearbyTab} label="Shops" />
                <Tab id="govt" current={nearbyTab} setCurrent={setNearbyTab} label="Gov. Offices" />
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="map-ph">
                  <div className="map-dot"></div>
                  <i className={`fas ${nearbyTab === "food" ? "fa-utensils" : nearbyTab === "hospital" ? "fa-hospital" : nearbyTab === "shops" ? "fa-store" : "fa-landmark"}`}></i>
                  <p>
                    {poisQ.isLoading 
                      ? "Fetching live locations from OpenStreetMap..." 
                      : `Nearby ${nearbyTab === "food" ? "Restaurants" : nearbyTab === "hospital" ? "Hospitals" : nearbyTab === "shops" ? "Shops" : "Offices"} near: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} ${rawPois.length > 0 ? "(Live)" : "(Fallback Data)"}`
                    }
                  </p>
                </div>
              </div>

              {poisQ.isLoading && (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--teal)" }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Loading nearby places...
                </div>
              )}

              {!poisQ.isLoading && nearbyTab === "food" && (
                <>
                  <div className="stitle">Restaurants Nearby</div>
                  <div className="food-grid">
                    {pois.map((f, i) => {
                      let emoji = "🍛";
                      const lowerName = f.name.toLowerCase();
                      if (lowerName.includes("pizza")) emoji = "🍕";
                      else if (lowerName.includes("burger")) emoji = "🍔";
                      else if (lowerName.includes("coffee") || lowerName.includes("cafe")) emoji = "☕";
                      else if (lowerName.includes("bakery") || lowerName.includes("sweet") || lowerName.includes("cake")) emoji = "🍰";
                      else if (i % 4 === 1) emoji = "🥞";
                      else if (i % 4 === 2) emoji = "🍗";
                      else if (i % 4 === 3) emoji = "🥘";
                      
                      return (
                        <div key={i} className="food-card" onClick={() => showToast("Opening " + f.name + "...")}>
                          <div className="food-thumb">{emoji}</div>
                          <div className="food-body">
                            <div className="food-name">{f.name}</div>
                            <div className="food-cat">{f.category}</div>
                            <div className="food-meta">
                              <div className="food-rating">{f.rating}</div>
                              <div className="food-dist">{f.dist}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {!poisQ.isLoading && nearbyTab === "hospital" && (
                <>
                  {pois.map((h, i) => {
                    let icon = "fa-hospital";
                    let bg = "rgba(192,86,42,0.1)";
                    let color = "var(--terra)";
                    if (h.type === "clinic" || h.category.toLowerCase().includes("clinic") || h.type === "doctors") {
                      icon = "fa-clinic-medical";
                      bg = "rgba(29,107,107,0.1)";
                      color = "var(--teal)";
                    } else if (i % 3 === 2) {
                      icon = "fa-heartbeat";
                      bg = "rgba(197,155,46,0.12)";
                      color = "var(--gold)";
                    }
                    return (
                      <div key={i} className="bill-item">
                        <div className="bi-icon" style={{ background: bg, color: color }}><i className={`fas ${icon}`}></i></div>
                        <div style={{ flex: 1 }}>
                          <div className="bi-name">{h.name}</div>
                          <div className="bi-due">{h.dist} · {h.category}</div>
                        </div>
                        <button className="btn teal" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => showToast("Calling " + h.name + "...")}>
                          <i className="fas fa-phone"></i>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {!poisQ.isLoading && nearbyTab === "shops" && (
                <>
                  {pois.map((s, i) => {
                    let icon = "fa-store";
                    let bg = "rgba(197,155,46,0.12)";
                    let color = "var(--gold)";
                    if (s.type === "pharmacy" || s.category.toLowerCase().includes("pharmacy")) {
                      icon = "fa-pills";
                      bg = "rgba(192,86,42,0.1)";
                      color = "var(--terra)";
                    } else if (i % 3 === 2) {
                      icon = "fa-book";
                      bg = "rgba(29,107,107,0.1)";
                      color = "var(--teal)";
                    }
                    return (
                      <div key={i} className="bill-item">
                        <div className="bi-icon" style={{ background: bg, color: color }}><i className={`fas ${icon}`}></i></div>
                        <div style={{ flex: 1 }}>
                          <div className="bi-name">{s.name}</div>
                          <div className="bi-due">{s.category} · {s.dist}</div>
                        </div>
                        <div className="bi-status sp" style={{ marginLeft: "auto" }}>Open</div>
                      </div>
                    );
                  })}
                </>
              )}

              {!poisQ.isLoading && nearbyTab === "govt" && (
                <>
                  {pois.map((g, i) => {
                    let icon = "fa-landmark";
                    let bg = "rgba(197,155,46,0.12)";
                    let color = "var(--gold)";
                    let btnLabel = "Book Slot";
                    let btnAction = () => showToast("Booking appointment at " + g.name + "...");
                    let btnClass = "btn outline";
                    
                    if (g.type === "police" || g.category.toLowerCase().includes("police")) {
                      icon = "fa-shield-alt";
                      bg = "rgba(192,86,42,0.1)";
                      color = "var(--terra)";
                      btnLabel = "Call";
                      btnAction = () => showToast("Calling " + g.name + "...");
                      btnClass = "btn";
                    } else if (g.type === "post_office" || g.category.toLowerCase().includes("passport") || i % 3 === 1) {
                      icon = "fa-passport";
                      bg = "rgba(29,107,107,0.1)";
                      color = "var(--teal)";
                      btnLabel = "Book Slot";
                      btnAction = () => showToast("Opening booking portal for " + g.name + "...");
                      btnClass = "btn outline";
                    }
                    return (
                      <div key={i} className="bill-item">
                        <div className="bi-icon" style={{ background: bg, color: color }}><i className={`fas ${icon}`}></i></div>
                        <div style={{ flex: 1 }}>
                          <div className="bi-name">{g.name}</div>
                          <div className="bi-due">{g.category} · {g.dist}</div>
                        </div>
                        <button className={btnClass} style={{ padding: "7px 14px", fontSize: 12 }} onClick={btnAction}>
                          {btnLabel}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* EMERGENCY */}
            <div className={`page ${page === "emergency" ? "active" : ""}`}>
              <div className="card" style={{ marginBottom: 20, borderColor: "rgba(192,86,42,0.3)", background: "rgba(192,86,42,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: 22, color: "var(--terra)" }}></i>
                  <div><div style={{ fontWeight: 700, fontSize: 14, color: "var(--terra)" }}>Emergency Services</div><div style={{ fontSize: 12, color: "var(--ink4)" }}>Tap to call · All calls are free on Indian networks</div></div>
                </div>
              </div>
              <div className="emg-grid">
                {[
                  { c: "e-police", i: "fa-shield-alt", n: "Police", num: "100", tel: "100" },
                  { c: "e-fire", i: "fa-fire-extinguisher", n: "Fire Brigade", num: "101", tel: "101" },
                  { c: "e-ambu", i: "fa-ambulance", n: "Ambulance", num: "108", tel: "108" },
                  { c: "e-dis", i: "fa-water", n: "Disaster Mgmt", num: "1078", tel: "1078" },
                  { c: "e-poi", i: "fa-skull-crossbones", n: "Poison Control", num: "1800-11-6117", tel: "18001166117" },
                  { c: "e-trf", i: "fa-traffic-light", n: "Traffic Police", num: "103", tel: "103" },
                ].map((e, i) => (
                  <a key={i} href={`tel:${e.tel}`} className={`emg-btn ${e.c}`} onClick={() => { showToast(`Calling ${e.n}: ${e.num}`); logActivity("emergency_call", `${e.n} (${e.num})`); }}>
                    <i className={`fas ${e.i}`}></i><div className="emg-name">{e.n}</div><div className="emg-num">{e.num}</div>
                  </a>
                ))}
              </div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="ch"><div className="ct">Send SOS Alert</div></div>
                <p style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 14 }}>Logs an alert with your live location ({coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}) to your activity log.</p>
                <div className="input-row">
                  <input className="ua-input" placeholder="Describe your emergency..." value={sosMsg} onChange={e => setSosMsg(e.target.value)} />
                  <button className="btn" style={{ background: "var(--terra)" }} onClick={sendSOS}><i className="fas fa-satellite-dish"></i> Send SOS</button>
                </div>
              </div>
              <div className="card">
                <div className="ch"><div className="ct">Recent Alerts</div></div>
                {activities.filter(a => a.kind === "sos_alert" || a.kind === "emergency_call").length === 0 && (
                  <div style={{ padding: 12, fontSize: 13, color: "var(--ink5)" }}>No alerts logged yet.</div>
                )}
                {activities.filter(a => a.kind === "sos_alert" || a.kind === "emergency_call").map(a => (
                  <div key={a.id} className="bill-item">
                    <div className="bi-icon" style={{ background: "rgba(192,86,42,0.1)", color: "var(--terra)" }}><i className={`fas ${activityIcon(a.kind)}`}></i></div>
                    <div style={{ flex: 1 }}><div className="bi-name">{a.label}</div><div className="bi-due">{fmtTimeAgo(a.created_at)}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* ENVIRONMENT */}
            <div className={`page ${page === "environment" ? "active" : ""}`}>
              <div className="g2" style={{ marginBottom: 20 }}>
                <div className="card">
                  <div className="ch"><div className="ct">Current Weather</div><div className="chip teal">{w?.city ?? "Loading"}</div></div>
                  <div className="wx-hero"><div className="wx-emoji">{weatherEmoji(w?.icon)}</div><div><div className="wx-temp">{w ? `${w.temp}°C` : "—"}</div><div className="wx-desc">{w ? `${w.description} · Feels like ${w.feelsLike}°C` : "Loading..."}</div><div className="wx-city">{w ? `${w.city}${w.country ? ", " + w.country : ""}` : "—"}</div></div></div>
                  <div className="wx-details">
                    <div className="wd"><div className="wd-i"><i className="fas fa-tint"></i></div><div className="wd-v">{w?.humidity ?? "—"}%</div><div className="wd-l">Humidity</div></div>
                    <div className="wd"><div className="wd-i"><i className="fas fa-wind"></i></div><div className="wd-v">{w?.wind ?? "—"} km/h</div><div className="wd-l">Wind</div></div>
                    <div className="wd"><div className="wd-i"><i className="fas fa-thermometer-half"></i></div><div className="wd-v">{w?.feelsLike ?? "—"}°</div><div className="wd-l">Feels Like</div></div>
                  </div>
                  <div className="divider"></div>
                  <div className="stitle">5-Day Forecast</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {(w?.days?.slice(0, 5) ?? []).map((d, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div>{weatherEmoji(d.icon)}</div>
                        <div style={{ fontSize: 11, color: "var(--ink5)" }}>{new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{d.max}°</div>
                      </div>
                    ))}
                    {!w && [0,1,2,3,4].map(i => (
                      <div key={i} style={{ textAlign: "center" }}><div>—</div><div style={{ fontSize: 11, color: "var(--ink5)" }}>—</div><div style={{ fontSize: 13, fontWeight: 700 }}>—</div></div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><div className="ct">Air Quality Index</div><div className="chip teal">Good</div></div>
                  <div className="aqi-wrap">
                    <div className="aqi-ring"><div className="aqi-n">42</div><div className="aqi-l">AQI</div></div>
                    <div><p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.8 }}><strong style={{ color: "var(--teal)" }}>Good</strong> — Air quality is satisfactory.<br />Suitable for outdoor activities.</p></div>
                  </div>
                  <div className="aqi-bar-row">
                    {[["PM2.5","28%","var(--teal)","14μg"],["PM10","40%","var(--gold)","40μg"],["NO₂","22%","var(--terra)","22μg"],["O₃","35%","var(--terra2)","70μg"],["SO₂","10%","var(--teal2)","5μg"]].map((b, i) => (
                      <div key={i} className="aqi-bar-item"><div className="abl">{b[0]}</div><div className="abb"><div className="abf" style={{ width: b[1], background: b[2] }}></div></div><div className="abv">{b[3]}</div></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><div className="ct">Noise Pollution Map</div></div>
                <div className="map-ph"><div className="map-dot"></div><i className="fas fa-volume-up"></i><p>Real-time Noise Levels — Local Zone</p></div>
                <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--teal)" }}></div>Quiet (&lt;50dB)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--gold)" }}></div>Moderate (50–70dB)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--terra)" }}></div>Loud (&gt;70dB)</div>
                </div>
              </div>
            </div>

            {/* SETTINGS */}
            <div className={`page ${page === "settings" ? "active" : ""}`}>
              <div className="g2">
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="ch"><div className="ct">Profile</div><button className="btn" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => saveProfileM.mutate()} disabled={saveProfileM.isPending}>{saveProfileM.isPending ? "Saving..." : "Save Changes"}</button></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div className="ava" style={{ width: 56, height: 56, fontSize: 20 }}>{initials}</div>
                      <div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>{pfName || userName}</div><div style={{ fontSize: 12, color: "var(--ink5)" }}>{userEmail}</div></div>
                    </div>
                    <div className="input-row" style={{ flexDirection: "column", gap: 10 }}>
                      <input className="ua-input" placeholder="Display name" value={pfName} onChange={e => setPfName(e.target.value)} />
                      <input className="ua-input" placeholder="Email" value={userEmail} disabled />
                      <input className="ua-input" placeholder="Phone" value={pfPhone} onChange={e => setPfPhone(e.target.value)} />
                      <input className="ua-input" placeholder="City" value={pfCity} onChange={e => setPfCity(e.target.value)} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="ch"><div className="ct">Notifications</div></div>
                    {([
                      ["billReminders", "Bill Payment Reminders", "3 days before due date"],
                      ["transportAlerts", "Transport Alerts", "Live delays & disruptions"],
                      ["aqiWarnings", "Air Quality Warnings", "When AQI exceeds 100"],
                      ["cityEvents", "City Event Updates", "Nearby events & closures"],
                    ] as Array<[keyof NotifPrefs, string, string]>).map(([k, l, s]) => (
                      <div key={k} className="sr">
                        <div><div className="sr-label">{l}</div><div className="sr-sub">{s}</div></div>
                        <label className="toggle">
                          <input type="checkbox" checked={notifs[k]} onChange={() => toggleNotif(k)} />
                          <div className="toggle-track"></div><div className="toggle-thumb"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="ch"><div className="ct">Preferences</div></div>
                    <div className="sr"><div className="sr-label">Language</div><select className="ua-input" style={{ maxWidth: 160, padding: "7px 12px" }}><option>English</option><option>தமிழ் (Tamil)</option><option>हिंदी</option></select></div>
                    <div className="sr"><div className="sr-label">Currency</div><select className="ua-input" style={{ maxWidth: 160, padding: "7px 12px" }}><option>₹ Indian Rupee</option><option>$ US Dollar</option></select></div>
                    <div className="sr"><div><div className="sr-label">Location Services</div><div className="sr-sub">{coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}</div></div><label className="toggle"><input type="checkbox" defaultChecked /><div className="toggle-track"></div><div className="toggle-thumb"></div></label></div>
                  </div>
                  <div className="card">
                    <div className="ch"><div className="ct">About</div></div>
                    <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 2.2, fontWeight: 500 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--ink5)" }}>App Version</span><span>UrbanAssist 3.1.0</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--ink5)" }}>City</span><span>{pfCity || w?.city || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--ink5)" }}>Data Refresh</span><span style={{ color: "var(--teal)" }}>Real-time</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--ink5)" }}>Plan</span><span style={{ color: "var(--gold)" }}>✦ Premium</span></div>
                    </div>
                    <div className="divider"></div>
                    <button className="btn outline" style={{ width: "100%" }} onClick={signOut}><i className="fas fa-sign-out-alt"></i> Sign Out</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
