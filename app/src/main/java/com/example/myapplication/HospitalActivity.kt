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

data class HospitalPOI(
    val name: String,
    val category: String,
    val rating: String,
    val dist: String,
    val type: String
)

class HospitalActivity : AppCompatActivity() {

    private val LOCATION_PERMISSION_REQ_CODE = 1000
    private var userLatitude: Double = 13.0827
    private var userLongitude: Double = 80.2707
    private var locationName: String = "Ambattur, Chennai"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_hospital)

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
            val intent = Intent(this, NearbyActivity::class.java).apply {
                putExtra("extra_tab", "food")
            }
            startActivity(intent)
            finish()
        }

        tabHospitals.setOnClickListener {
            // Already here, do nothing
        }

        tabShops.setOnClickListener {
            val intent = Intent(this, NearbyActivity::class.java).apply {
                putExtra("extra_tab", "shops")
            }
            startActivity(intent)
            finish()
        }

        tabGov.setOnClickListener {
            val intent = Intent(this, NearbyActivity::class.java).apply {
                putExtra("extra_tab", "gov")
            }
            startActivity(intent)
            finish()
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

        // Real-time location logic
        checkLocationPermission(mapLabel)
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
                fetchNearbyHospitals()
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
                fetchNearbyHospitals()
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
                fetchNearbyHospitals()
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
                        fetchNearbyHospitals()
                    }
                }, 5000)
            }
        } catch (e: SecurityException) {
            userLatitude = 13.0827
            userLongitude = 80.2707
            fetchNominatimDetails(13.0827, 80.2707, mapLabel)
            fetchNearbyHospitals()
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
                mapLabel.text = "Hospitals near $locationName"
            }
        }
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val results = FloatArray(1)
        Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return (results[0] / 1000.0)
    }

    private fun fetchNearbyHospitals() {
        val placesGrid = findViewById<android.widget.GridLayout>(R.id.placesGrid)
        val sectionTitle = findViewById<TextView>(R.id.sectionTitle)
        
        sectionTitle.text = "Hospitals Nearby (Loading...)"
        
        lifecycleScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            val fetchedPois = ArrayList<HospitalPOI>()
            var isLive = false
            
            val query = "[out:json];node(around:3000,$userLatitude,$userLongitude)[amenity~\"hospital|clinic|doctors\"];out 12;"
            
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
                            val name = tags?.get("name")?.jsonPrimitive?.content ?: "Medical Facility"
                            
                            val d = calculateDistance(userLatitude, userLongitude, lat, lon)
                            val ratingVal = if (id.isNotEmpty()) {
                                val r = 4.0 + (Math.abs(id.hashCode()) % 10) * 0.1
                                String.format("%.1f", r)
                            } else {
                                "4.2"
                            }
                            
                            val category = if (tags?.get("amenity")?.jsonPrimitive?.content == "hospital") {
                                "General Hospital"
                            } else {
                                "Medical Clinic"
                            }
                            
                            val amenityType = tags?.get("amenity")?.jsonPrimitive?.content ?: "hospital"
                            
                            fetchedPois.add(HospitalPOI(name, category, ratingVal, String.format("%.1f km", d), amenityType))
                        }
                    }
                }
            } catch (e: Exception) {
                // Fetch failed
            }
            
            if (!isLive) {
                fetchedPois.addAll(getFallbackHospitals())
            }
            
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                sectionTitle.text = if (isLive) "Hospitals Nearby (Live)" else "Hospitals Nearby (Fallback Data)"
                placesGrid.removeAllViews()
                
                for ((index, poi) in fetchedPois.withIndex()) {
                    val cardView = createPoiCard(poi, index)
                    placesGrid.addView(cardView)
                }
            }
        }
    }

    private fun getFallbackHospitals(): List<HospitalPOI> {
        return listOf(
            HospitalPOI("Government Royapettah Hospital", "General Hospital", "4.1", "2.3 km", "hospital"),
            HospitalPOI("Fortis Malar Hospital", "Private Hospital", "4.2", "5.1 km", "hospital"),
            HospitalPOI("Ambattur Primary Health Centre", "Medical Clinic", "4.3", "0.5 km", "clinic")
        )
    }

    private fun createPoiCard(poi: HospitalPOI, index: Int): View {
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
                Toast.makeText(this@HospitalActivity, "Calling ${poi.name}...", Toast.LENGTH_SHORT).show()
            }
        }

        val iconView = ImageView(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(dp24, dp24).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
            }
            contentDescription = "Hospital Icon"
            setImageResource(android.R.drawable.ic_menu_save)
            
            val colorStr = when (index % 4) {
                0 -> "#E74C3C" // Red
                1 -> "#3498DB" // Blue
                2 -> "#1ABC9C" // Teal
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
            Toast.makeText(this, "Permission denied. Showing default area.", Toast.LENGTH_SHORT).show()
            detectCurrentLocation(findViewById(R.id.mapLabel))
        }
    }
}
