package com.example.myapplication

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.jsonArray

data class POI(
    val name: String,
    val category: String,
    val rating: String,
    val dist: String,
    val type: String
)

class NearbyActivity : AppCompatActivity() {

    private val LOCATION_PERMISSION_REQ_CODE = 1000
    private var userLatitude: Double = 13.0827
    private var userLongitude: Double = 80.2707
    private var currentTab: String = "food" // "food", "shops", "gov"
    private var locationName: String = "Ambattur, Chennai"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_nearby)

        currentTab = intent.getStringExtra("extra_tab") ?: "food"

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val mapLabel = findViewById<TextView>(R.id.mapLabel)
        
        val tabFood = findViewById<View>(R.id.tabFood)
        val tabHospitals = findViewById<View>(R.id.tabHospitals)
        val tabShops = findViewById<View>(R.id.tabShops)
        val tabGov = findViewById<View>(R.id.tabGov)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }
        
        tabFood.setOnClickListener {
            if (currentTab != "food") {
                currentTab = "food"
                updateTabStyles()
                fetchNearbyPlaces()
            }
        }

        tabHospitals.setOnClickListener {
            startActivity(Intent(this, HospitalActivity::class.java))
            finish()
        }

        tabShops.setOnClickListener {
            if (currentTab != "shops") {
                currentTab = "shops"
                updateTabStyles()
                fetchNearbyPlaces()
            }
        }

        tabGov.setOnClickListener {
            if (currentTab != "gov") {
                currentTab = "gov"
                updateTabStyles()
                fetchNearbyPlaces()
            }
        }

        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> finish()
                R.id.nav_transport -> {
                    startActivity(Intent(this, TransportActivity::class.java))
                    finish()
                }
                R.id.nav_bills -> {
                    startActivity(Intent(this, BillsActivity::class.java))
                    finish()
                }
                R.id.nav_nearby -> drawerLayout.closeDrawer(GravityCompat.START)
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
                R.id.nav_settings -> {
                    startActivity(Intent(this, SettingsActivity::class.java))
                    finish()
                }
                else -> Toast.makeText(this, "Opening ${menuItem.title}...", Toast.LENGTH_SHORT).show()
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }

        navigationView.setCheckedItem(R.id.nav_nearby)

        updateTabStyles()

        // Real-time location logic
        checkLocationPermission(mapLabel)
    }

    private fun updateTabStyles() {
        val tabFood = findViewById<TextView>(R.id.tabFood)
        val tabHospitals = findViewById<TextView>(R.id.tabHospitals)
        val tabShops = findViewById<TextView>(R.id.tabShops)
        val tabGov = findViewById<TextView>(R.id.tabGov)

        val activeColor = resources.getColor(R.color.sidebar_bg)
        val inactiveColor = resources.getColor(R.color.text_secondary)

        // Reset backgrounds and colors
        tabFood.background = null
        tabFood.setTextColor(inactiveColor)
        tabFood.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabHospitals.background = null
        tabHospitals.setTextColor(inactiveColor)
        tabHospitals.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabShops.background = null
        tabShops.setTextColor(inactiveColor)
        tabShops.setTypeface(null, android.graphics.Typeface.NORMAL)

        tabGov.background = null
        tabGov.setTextColor(inactiveColor)
        tabGov.setTypeface(null, android.graphics.Typeface.NORMAL)

        // Highlight active tab
        when (currentTab) {
            "food" -> {
                tabFood.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabFood.setTextColor(activeColor)
                tabFood.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "shops" -> {
                tabShops.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabShops.setTextColor(activeColor)
                tabShops.setTypeface(null, android.graphics.Typeface.BOLD)
            }
            "gov" -> {
                tabGov.setBackgroundResource(R.drawable.tab_item_selected_bg)
                tabGov.setTextColor(activeColor)
                tabGov.setTypeface(null, android.graphics.Typeface.BOLD)
            }
        }
    }

    private fun checkLocationPermission(mapLabel: TextView) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), LOCATION_PERMISSION_REQ_CODE)
        } else {
            detectCurrentLocation(mapLabel)
        }
    }

    private fun detectCurrentLocation(mapLabel: TextView) {
        mapLabel.text = getString(R.string.detecting_location)
        
        val locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        
        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                locationManager.removeUpdates(this)
                userLatitude = location.latitude
                userLongitude = location.longitude
                fetchNominatimDetails(location.latitude, location.longitude, mapLabel)
                fetchNearbyPlaces()
            }
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }
        
        try {
            val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            
            if (!isGpsEnabled && !isNetworkEnabled) {
                userLatitude = 13.0827
                userLongitude = 80.2707
                fetchNominatimDetails(13.0827, 80.2707, mapLabel)
                fetchNearbyPlaces()
                return
            }
            
            val lastKnown = if (isNetworkEnabled) {
                locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            } else {
                locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            }
            
            if (lastKnown != null) {
                userLatitude = lastKnown.latitude
                userLongitude = lastKnown.longitude
                fetchNominatimDetails(lastKnown.latitude, lastKnown.longitude, mapLabel)
                fetchNearbyPlaces()
            } else {
                if (isNetworkEnabled) {
                    locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, locationListener)
                } else {
                    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, locationListener)
                }
                
                mapLabel.postDelayed({
                    locationManager.removeUpdates(locationListener)
                    if (mapLabel.text == getString(R.string.detecting_location)) {
                        userLatitude = 13.0827
                        userLongitude = 80.2707
                        fetchNominatimDetails(13.0827, 80.2707, mapLabel)
                        fetchNearbyPlaces()
                    }
                }, 5000)
            }
        } catch (e: SecurityException) {
            userLatitude = 13.0827
            userLongitude = 80.2707
            fetchNominatimDetails(13.0827, 80.2707, mapLabel)
            fetchNearbyPlaces()
        }
    }

    private fun fetchNominatimDetails(latitude: Double, longitude: Double, mapLabel: TextView) {
        lifecycleScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            var tempName = "Ambattur, Chennai"
            try {
                val url = java.net.URL("https://nominatim.openstreetmap.org/reverse?lat=$latitude&lon=$longitude&format=json")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.setRequestProperty("User-Agent", "UrbanAssist-AndroidApp")
                connection.connectTimeout = 3000
                connection.readTimeout = 3000
                
                if (connection.responseCode == 200) {
                    val jsonText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }.parseToJsonElement(jsonText)
                    val addressObj = json.jsonObject["address"]?.jsonObject
                    val suburb = addressObj?.get("suburb")?.jsonPrimitive?.content
                    val neighbourhood = addressObj?.get("neighbourhood")?.jsonPrimitive?.content
                    val city = addressObj?.get("city")?.jsonPrimitive?.content 
                        ?: addressObj?.get("town")?.jsonPrimitive?.content 
                        ?: addressObj?.get("village")?.jsonPrimitive?.content
                    
                    tempName = when {
                        !suburb.isNullOrEmpty() -> "$suburb, ${city ?: "Chennai"}"
                        !neighbourhood.isNullOrEmpty() -> "$neighbourhood, ${city ?: "Chennai"}"
                        !city.isNullOrEmpty() -> city
                        else -> json.jsonObject["display_name"]?.jsonPrimitive?.content?.split(",")?.take(2)?.joinToString(",") ?: "Ambattur, Chennai"
                    }
                }
            } catch (e: Exception) {
                // Keep default
            }
            
            locationName = tempName
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                mapLabel.text = when (currentTab) {
                    "food" -> "Restaurants near $locationName"
                    "shops" -> "Shops near $locationName"
                    else -> "Services near $locationName"
                }
            }
        }
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return (results[0] / 1000.0)
    }

    private fun fetchNearbyPlaces() {
        val placesGrid = findViewById<android.widget.GridLayout>(R.id.placesGrid)
        val sectionTitle = findViewById<TextView>(R.id.sectionTitle)
        
        sectionTitle.text = when (currentTab) {
            "food" -> "Restaurants Nearby (Loading...)"
            "shops" -> "Shops Nearby (Loading...)"
            else -> "Gov. Services Nearby (Loading...)"
        }
        
        lifecycleScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            val fetchedPois = ArrayList<POI>()
            var isLive = false
            
            val query = when (currentTab) {
                "food" -> "[out:json];node(around:3000,$userLatitude,$userLongitude)[amenity=restaurant];out 12;"
                "shops" -> "[out:json];node(around:3000,$userLatitude,$userLongitude)[shop~\"supermarket|convenience|department_store|chemist|pharmacy\"];out 12;"
                else -> "[out:json];node(around:3000,$userLatitude,$userLongitude)[amenity~\"townhall|police|post_office\"];out 12;"
            }
            
            try {
                val url = java.net.URL("https://overpass-api.de/api/interpreter?data=${java.net.URLEncoder.encode(query, "UTF-8")}")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.setRequestProperty("User-Agent", "UrbanAssist-AndroidApp")
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                
                if (connection.responseCode == 200) {
                    val jsonText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }.parseToJsonElement(jsonText)
                    val elements = json.jsonObject["elements"]?.jsonArray
                    if (elements != null && elements.size > 0) {
                        isLive = true
                        for (el in elements) {
                            val obj = el.jsonObject
                            val id = obj["id"]?.jsonPrimitive?.content ?: ""
                            val lat = obj["lat"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: 0.0
                            val lon = obj["lon"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: 0.0
                            val tags = obj["tags"]?.jsonObject
                            val name = tags?.get("name")?.jsonPrimitive?.content ?: "Local Outlet"
                            
                            val d = calculateDistance(userLatitude, userLongitude, lat, lon)
                            val ratingVal = if (id.isNotEmpty()) {
                                val r = 4.0 + (Math.abs(id.hashCode()) % 10) * 0.1
                                String.format("%.1f", r)
                            } else {
                                "4.2"
                            }
                            
                            val category = when (currentTab) {
                                "food" -> {
                                    val cuisine = tags?.get("cuisine")?.jsonPrimitive?.content
                                    if (!cuisine.isNullOrEmpty()) {
                                        cuisine.replaceFirstChar { it.uppercase() } + " Cuisine"
                                    } else {
                                        "Multi-Cuisine Restaurant"
                                    }
                                }
                                "shops" -> {
                                    val shopType = tags?.get("shop")?.jsonPrimitive?.content
                                    val amenityType = tags?.get("amenity")?.jsonPrimitive?.content
                                    when {
                                        shopType == "supermarket" -> "Supermarket"
                                        amenityType == "pharmacy" -> "Pharmacy"
                                        else -> "Grocery Shop"
                                    }
                                }
                                else -> {
                                    val amenityType = tags?.get("amenity")?.jsonPrimitive?.content
                                    when (amenityType) {
                                        "police" -> "Police Station"
                                        "post_office" -> "Post Office"
                                        else -> "Government Building"
                                    }
                                }
                            }
                            
                            val amenityType = tags?.get("amenity")?.jsonPrimitive?.content 
                                ?: tags?.get("shop")?.jsonPrimitive?.content 
                                ?: "amenity"
                            
                            fetchedPois.add(POI(name, category, ratingVal, String.format("%.1f km", d), amenityType))
                        }
                    }
                }
            } catch (e: Exception) {
                // Fetch failed, use mock/fallback
            }
            
            if (!isLive) {
                fetchedPois.addAll(getFallbackPois(currentTab))
            }
            
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                sectionTitle.text = when (currentTab) {
                    "food" -> if (isLive) "Restaurants Nearby (Live)" else "Restaurants Nearby (Fallback Data)"
                    "shops" -> if (isLive) "Shops Nearby (Live)" else "Shops Nearby (Fallback Data)"
                    else -> if (isLive) "Gov. Services Nearby (Live)" else "Gov. Services Nearby (Fallback Data)"
                }
                
                findViewById<TextView>(R.id.mapLabel).text = when (currentTab) {
                    "food" -> "Restaurants near $locationName"
                    "shops" -> "Shops near $locationName"
                    else -> "Services near $locationName"
                }

                placesGrid.removeAllViews()
                
                for ((index, poi) in fetchedPois.withIndex()) {
                    val cardView = createPoiCard(poi, index)
                    placesGrid.addView(cardView)
                }
            }
        }
    }

    private fun getFallbackPois(tab: String): List<POI> {
        return when (tab) {
            "food" -> listOf(
                POI("Saravana Bhavan", "South Indian - Veg", "4.5", "0.8 km", "restaurant"),
                POI("Murugan Idli Shop", "Tiffin - Breakfast", "4.7", "1.2 km", "restaurant"),
                POI("Anjappar Chettinad", "Chettinad - Non-Veg", "4.3", "2.1 km", "restaurant"),
                POI("Junior Kuppanna", "Kongu Cuisine", "4.6", "3.0 km", "restaurant")
            )
            "shops" -> listOf(
                POI("Ambattur Super Market", "Grocery", "4.4", "0.3 km", "shop"),
                POI("MedPlus Pharmacy", "Medicine", "4.5", "0.7 km", "pharmacy"),
                POI("District Central Library", "Books", "4.6", "1.4 km", "library")
            )
            else -> listOf(
                POI("Ambattur Taluk Office", "Land records, certificates", "4.0", "0.9 km", "townhall"),
                POI("Regional Passport Office", "Passport", "4.2", "6.2 km", "passport"),
                POI("Ambattur Police Station", "Law Enforcement", "4.5", "0.6 km", "police")
            )
        }
    }

    private fun createPoiCard(poi: POI, index: Int): View {
        val dp16 = (16 * resources.displayMetrics.density).toInt()
        val dp12 = (12 * resources.displayMetrics.density).toInt()
        val dp8 = (8 * resources.displayMetrics.density).toInt()
        val dp6 = (6 * resources.displayMetrics.density).toInt()
        val dp24 = (24 * resources.displayMetrics.density).toInt()

        val cardView = android.widget.LinearLayout(this).apply {
            val params = android.widget.GridLayout.LayoutParams().apply {
                width = 0
                height = android.widget.GridLayout.LayoutParams.WRAP_CONTENT
                columnSpec = android.widget.GridLayout.spec(android.widget.GridLayout.UNDEFINED, 1f)
                rowSpec = android.widget.GridLayout.spec(android.widget.GridLayout.UNDEFINED)
                setMargins(dp6, dp6, dp6, dp6)
            }
            layoutParams = params
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.dash_card_bg)
            setPadding(dp16, dp16, dp16, dp16)
            setOnClickListener {
                Toast.makeText(this@NearbyActivity, "Opening ${poi.name}...", Toast.LENGTH_SHORT).show()
            }
        }

        val iconView = ImageView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(dp24, dp24).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
            }
            contentDescription = "Place Icon"
            
            val iconRes = when (poi.type) {
                "police" -> android.R.drawable.ic_menu_compass
                "pharmacy" -> android.R.drawable.ic_menu_add
                "library" -> android.R.drawable.ic_menu_gallery
                else -> android.R.drawable.btn_star_big_off
            }
            setImageResource(iconRes)
            
            val colorStr = when (index % 4) {
                0 -> "#E67E22" // Orange
                1 -> "#F1C40F" // Gold
                2 -> "#3498DB" // Blue
                else -> "#8E44AD" // Purple
            }
            setColorFilter(android.graphics.Color.parseColor(colorStr))
        }

        val nameView = TextView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp12
            }
            text = poi.name
            setTextColor(resources.getColor(R.color.sidebar_bg))
            textSize = 14f
            setTypeface(null, android.graphics.Typeface.BOLD)
        }

        val catView = TextView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            )
            text = poi.category
            setTextColor(resources.getColor(R.color.text_secondary))
            textSize = 10f
        }

        val footerView = android.widget.RelativeLayout(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp8
            }
        }

        val ratingView = TextView(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
                android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT)
            }
            text = "⭐ ${poi.rating}"
            setTextColor(resources.getColor(R.color.accent_orange))
            textSize = 10f
        }

        val distView = TextView(this).apply {
            layoutParams = android.widget.RelativeLayout.LayoutParams(
                android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT,
                android.widget.RelativeLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT)
            }
            text = poi.dist
            setTextColor(resources.getColor(R.color.text_secondary))
            textSize = 10f
        }

        footerView.addView(ratingView)
        footerView.addView(distView)

        cardView.addView(iconView)
        cardView.addView(nameView)
        cardView.addView(catView)
        cardView.addView(footerView)

        return cardView
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_REQ_CODE && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            detectCurrentLocation(findViewById(R.id.mapLabel))
        } else {
            Toast.makeText(this, "Location permission denied. Showing default area.", Toast.LENGTH_SHORT).show()
            detectCurrentLocation(findViewById(R.id.mapLabel))
        }
    }
}
