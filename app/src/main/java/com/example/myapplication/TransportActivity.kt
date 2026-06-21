package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class TransportActivity : AppCompatActivity() {

    private lateinit var metroListContainer: LinearLayout
    private lateinit var busListContainer: LinearLayout
    private lateinit var cabListContainer: LinearLayout
    private lateinit var bikeListContainer: LinearLayout
    private var allRoutes: List<TransportRoute> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_transport)

        metroListContainer = findViewById(R.id.metroListContainer)
        busListContainer = findViewById(R.id.busListContainer)
        cabListContainer = findViewById(R.id.cabListContainer)
        bikeListContainer = findViewById(R.id.bikeListContainer)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)

        val tabMetro = findViewById<TextView>(R.id.tabMetro)
        val tabBus = findViewById<TextView>(R.id.tabBus)
        val tabCab = findViewById<TextView>(R.id.tabCab)
        val tabBike = findViewById<TextView>(R.id.tabBike)

        val metroSection = findViewById<View>(R.id.metroSection)
        val busSection = findViewById<View>(R.id.busSection)
        val cabSection = findViewById<View>(R.id.cabSection)
        val bikeSection = findViewById<View>(R.id.bikeSection)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        tabMetro.setOnClickListener {
            switchToSection("metro", tabMetro, tabBus, tabCab, tabBike, metroSection, busSection, cabSection, bikeSection)
        }

        tabBus.setOnClickListener {
            switchToSection("bus", tabMetro, tabBus, tabCab, tabBike, metroSection, busSection, cabSection, bikeSection)
        }

        tabCab.setOnClickListener {
            switchToSection("cab", tabMetro, tabBus, tabCab, tabBike, metroSection, busSection, cabSection, bikeSection)
        }

        tabBike.setOnClickListener {
            switchToSection("bike", tabMetro, tabBus, tabCab, tabBike, metroSection, busSection, cabSection, bikeSection)
        }

        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> finish()
                R.id.nav_transport -> drawerLayout.closeDrawer(GravityCompat.START)
                R.id.nav_bills -> {
                    startActivity(Intent(this, BillsActivity::class.java))
                    finish()
                }
                R.id.nav_nearby -> {
                    startActivity(Intent(this, NearbyActivity::class.java))
                    finish()
                }
                R.id.nav_emergency -> {
                    startActivity(Intent(this, EmergencyActivity::class.java))
                    finish()
                }
                R.id.nav_environment -> {
                    startActivity(Intent(this, EnvironmentActivity::class.java))
                    finish()
                }
                R.id.nav_tasks -> {
                    startActivity(Intent(this, TasksActivity::class.java))
                    finish()
                }
                R.id.nav_gov -> {
                    startActivity(Intent(this, GovServicesActivity::class.java))
                    finish()
                }
                R.id.nav_location -> {
                    startActivity(Intent(this, LocationActivity::class.java))
                    finish()
                }
                else -> Toast.makeText(this, "Opening ${menuItem.title}...", Toast.LENGTH_SHORT).show()
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
        
        navigationView.setCheckedItem(R.id.nav_transport)

        val plannerFromInput = findViewById<android.widget.EditText>(R.id.plannerFromInput)
        val plannerToInput = findViewById<android.widget.EditText>(R.id.plannerToInput)
        val btnPlanRoute = findViewById<android.widget.Button>(R.id.btnPlanRoute)

        btnPlanRoute.setOnClickListener {
            val fromText = plannerFromInput.text.toString().trim().lowercase()
            val toText = plannerToInput.text.toString().trim().lowercase()

            if (fromText.isEmpty() || toText.isEmpty()) {
                Toast.makeText(this, "Please enter both From and To locations", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val matchedRoute = allRoutes.find { route ->
                val routeSource = (route.source ?: "").lowercase()
                val routeDest = (route.destination ?: "").lowercase()
                (routeSource.contains(fromText) || fromText.contains(routeSource)) &&
                (routeDest.contains(toText) || toText.contains(routeDest))
            }

            if (matchedRoute != null) {
                val fareText = matchedRoute.fare?.let { "Fare: ₹${it.toInt()}" } ?: ""
                Toast.makeText(
                    this,
                    "Route: ${matchedRoute.route_name} (${matchedRoute.vehicle_type}) • ${matchedRoute.source} → ${matchedRoute.destination} • $fareText • Duration: ~15 mins",
                    Toast.LENGTH_LONG
                ).show()
            } else {
                Toast.makeText(
                    this,
                    "No direct route found for \"$fromText\" to \"$toText\". Try \"Ambattur\" and \"Broadway\".",
                    Toast.LENGTH_LONG
                ).show()
            }
        }

        fetchRoutes()
        populateCabAndBikeLists()
    }

    private fun fetchRoutes() {
        lifecycleScope.launch {
            try {
                val routes = SupabaseManager.client.postgrest["transport_routes"].select().decodeList<TransportRoute>()
                allRoutes = routes
                
                metroListContainer.removeAllViews()
                busListContainer.removeAllViews()

                routes.forEach { route ->
                    val isMetro = route.vehicle_type?.contains("Metro", ignoreCase = true) == true
                    val container = if (isMetro) metroListContainer else busListContainer
                    
                    val view = LayoutInflater.from(this@TransportActivity).inflate(R.layout.item_transport, container, false)
                    val icon = view.findViewById<ImageView>(R.id.transportIcon)
                    val title = view.findViewById<TextView>(R.id.transportTitle)
                    val desc = view.findViewById<TextView>(R.id.transportDesc)
                    val timeText = view.findViewById<TextView>(R.id.transportTime)
                    val statusText = view.findViewById<TextView>(R.id.transportStatus)

                    title.text = "${route.route_name}: ${route.source} → ${route.destination}"
                    
                    if (isMetro) {
                        icon.setImageResource(android.R.drawable.ic_dialog_map)
                        icon.imageTintList = android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this@TransportActivity, R.color.btn_route_bg))
                        desc.text = "Fare: ₹${route.fare?.toInt() ?: 0} • Live Map Info"
                        timeText.text = "3 min"
                        statusText.text = "On time"
                        statusText.setTextColor(ContextCompat.getColor(this@TransportActivity, R.color.badge_green))
                    } else {
                        icon.setImageResource(android.R.drawable.ic_dialog_map)
                        icon.imageTintList = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#27AE60"))
                        desc.text = "Fare: ₹${route.fare?.toInt() ?: 0} • Stop Info"
                        timeText.text = "6 min"
                        statusText.text = "On time"
                        statusText.setTextColor(ContextCompat.getColor(this@TransportActivity, R.color.badge_green))
                    }

                    container.addView(view)
                }
            } catch (e: Exception) {
                // fall back or show toast
            }
        }
    }

    private fun populateCabAndBikeLists() {
        cabListContainer.removeAllViews()
        bikeListContainer.removeAllViews()

        val cabs = listOf(
            Triple("Auto Rickshaw (Nearby)", "3 autos within 500m • Meter fare", Pair("2 min", "₹12/km")),
            Triple("City Cab Express", "AC Sedan • 4 seats", Pair("5 min", "₹18/km")),
            Triple("Shared Cab Pool", "2 co-passengers • Koyambedu", Pair("8 min", "₹9/km"))
        )

        cabs.forEach { cab ->
            val view = LayoutInflater.from(this).inflate(R.layout.item_transport, cabListContainer, false)
            view.findViewById<ImageView>(R.id.transportIcon).apply {
                setImageResource(android.R.drawable.ic_menu_directions)
                imageTintList = android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this@TransportActivity, R.color.accent_orange))
            }
            view.findViewById<TextView>(R.id.transportTitle).text = cab.first
            view.findViewById<TextView>(R.id.transportDesc).text = cab.second
            view.findViewById<TextView>(R.id.transportTime).text = cab.third.first
            view.findViewById<TextView>(R.id.transportStatus).apply {
                text = cab.third.second
                setTextColor(ContextCompat.getColor(this@TransportActivity, R.color.sidebar_bg))
            }
            cabListContainer.addView(view)
        }

        findViewById<android.widget.Button>(R.id.btnBookAuto).setOnClickListener {
            Toast.makeText(this, "Booking auto near you...", Toast.LENGTH_SHORT).show()
        }

        val bikes = listOf(
            Triple("Smart Cycle Station A4", "Ambattur Estate • 8 bikes", Pair("350m", "₹5/30min")),
            Triple("Electric Scooter Hub", "MTH Road • 12 scooters • Charged", Pair("600m", "₹1.5/min"))
        )

        bikes.forEach { bike ->
            val view = LayoutInflater.from(this).inflate(R.layout.item_transport, bikeListContainer, false)
            view.findViewById<ImageView>(R.id.transportIcon).apply {
                setImageResource(android.R.drawable.ic_menu_compass)
                imageTintList = android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this@TransportActivity, R.color.badge_green))
            }
            view.findViewById<TextView>(R.id.transportTitle).text = bike.first
            view.findViewById<TextView>(R.id.transportDesc).text = bike.second
            view.findViewById<TextView>(R.id.transportTime).text = bike.third.first
            view.findViewById<TextView>(R.id.transportStatus).apply {
                text = bike.third.second
                setTextColor(ContextCompat.getColor(this@TransportActivity, R.color.sidebar_bg))
            }
            bikeListContainer.addView(view)
        }
    }

    private fun switchToSection(
        type: String,
        tabMetro: TextView,
        tabBus: TextView,
        tabCab: TextView,
        tabBike: TextView,
        metroSection: View,
        busSection: View,
        cabSection: View,
        bikeSection: View
    ) {
        metroSection.visibility = if (type == "metro") View.VISIBLE else View.GONE
        busSection.visibility = if (type == "bus") View.VISIBLE else View.GONE
        cabSection.visibility = if (type == "cab") View.VISIBLE else View.GONE
        bikeSection.visibility = if (type == "bike") View.VISIBLE else View.GONE

        val activeColor = ContextCompat.getColor(this, R.color.sidebar_bg)
        val inactiveColor = ContextCompat.getColor(this, R.color.text_secondary)

        tabMetro.background = null
        tabMetro.setTextColor(inactiveColor)
        tabMetro.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabBus.background = null
        tabBus.setTextColor(inactiveColor)
        tabBus.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabCab.background = null
        tabCab.setTextColor(inactiveColor)
        tabCab.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabBike.background = null
        tabBike.setTextColor(inactiveColor)
        tabBike.setTypeface(null, android.graphics.Typeface.NORMAL)

        when (type) {
            "metro" -> {
                tabMetro.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabMetro.setTextColor(activeColor)
                tabMetro.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "bus" -> {
                tabBus.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabBus.setTextColor(activeColor)
                tabBus.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "cab" -> {
                tabCab.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabCab.setTextColor(activeColor)
                tabCab.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "bike" -> {
                tabBike.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabBike.setTextColor(activeColor)
                tabBike.setTypeface(null, android.graphics.Typeface.BOLD)
            }
        }
    }
}
