package com.example.myapplication

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class EnvironmentActivity : AppCompatActivity() {

    private lateinit var temperatureText: TextView
    private lateinit var humidityText: TextView
    private lateinit var aqiText: TextView
    private lateinit var locationLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_environment)

        temperatureText = findViewById(R.id.temperatureText)
        humidityText = findViewById(R.id.humidityText)
        aqiText = findViewById(R.id.aqiText)
        locationLabel = findViewById(R.id.locationLabel)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
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
                R.id.nav_nearby -> {
                    startActivity(Intent(this, NearbyActivity::class.java))
                    finish()
                }
                R.id.nav_emergency -> {
                    startActivity(Intent(this, EmergencyActivity::class.java))
                    finish()
                }
                R.id.nav_environment -> drawerLayout.closeDrawer(GravityCompat.START)
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

        navigationView.setCheckedItem(R.id.nav_environment)

        fetchEnvironmentData()
    }

    private fun fetchEnvironmentData() {
        val locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        
        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                locationManager.removeUpdates(this)
                loadRealTimeWeatherAndAqi(location.latitude, location.longitude)
            }
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }
        
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 3000)
            loadRealTimeWeatherAndAqi(13.0827, 80.2707) // fallback initially
        } else {
            try {
                val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
                
                if (!isGpsEnabled && !isNetworkEnabled) {
                    loadRealTimeWeatherAndAqi(13.0827, 80.2707)
                    return
                }
                
                val lastKnown = if (isNetworkEnabled) {
                    locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                } else {
                    locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                }
                
                if (lastKnown != null) {
                    loadRealTimeWeatherAndAqi(lastKnown.latitude, lastKnown.longitude)
                } else {
                    if (isNetworkEnabled) {
                        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, locationListener)
                    } else {
                        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, locationListener)
                    }
                    
                    locationLabel.postDelayed({
                        locationManager.removeUpdates(locationListener)
                        if (locationLabel.text == "Detecting location..." || locationLabel.text == "Unknown") {
                            loadRealTimeWeatherAndAqi(13.0827, 80.2707)
                        }
                    }, 5000)
                }
            } catch (e: SecurityException) {
                loadRealTimeWeatherAndAqi(13.0827, 80.2707)
            }
        }
    }

    private fun loadRealTimeWeatherAndAqi(latitude: Double, longitude: Double) {
        lifecycleScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            var locationName = "Ambattur, Chennai"
            var temperature = "--"
            var humidity = "--"
            var aqi = "--"
            
            // 1. Nominatim Reverse Geocoding
            try {
                val url = java.net.URL("https://nominatim.openstreetmap.org/reverse?lat=$latitude&lon=$longitude&format=json")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.setRequestProperty("User-Agent", "UrbanAssist-AndroidApp")
                connection.connectTimeout = 3000
                
                if (connection.responseCode == 200) {
                    val jsonText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }.parseToJsonElement(jsonText)
                    val addressObj = json.jsonObject["address"]?.jsonObject
                    val suburb = addressObj?.get("suburb")?.jsonPrimitive?.content
                    val city = addressObj?.get("city")?.jsonPrimitive?.content 
                        ?: addressObj?.get("town")?.jsonPrimitive?.content 
                        ?: addressObj?.get("village")?.jsonPrimitive?.content
                    
                    locationName = if (!suburb.isNullOrEmpty()) "$suburb, ${city ?: "Chennai"}" else city ?: "Ambattur, Chennai"
                }
            } catch (e: Exception) {}

            // 2. Open-Meteo Weather
            try {
                val url = java.net.URL("https://api.open-meteo.com/v1/forecast?latitude=$latitude&longitude=$longitude&current=temperature_2m,relative_humidity_2m")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 3000
                
                if (connection.responseCode == 200) {
                    val jsonText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }.parseToJsonElement(jsonText)
                    val currentObj = json.jsonObject["current"]?.jsonObject
                    val tempVal = currentObj?.get("temperature_2m")?.jsonPrimitive?.content
                    val humidVal = currentObj?.get("relative_humidity_2m")?.jsonPrimitive?.content
                    
                    if (tempVal != null) {
                        temperature = "${tempVal.toDoubleOrNull()?.toInt() ?: tempVal}°C"
                    }
                    if (humidVal != null) {
                        humidity = "${humidVal.toDoubleOrNull()?.toInt() ?: humidVal}%"
                    }
                }
            } catch (e: Exception) {}

            // 3. Open-Meteo AQI us_aqi
            try {
                val url = java.net.URL("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=$latitude&longitude=$longitude&current=us_aqi")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 3000
                
                if (connection.responseCode == 200) {
                    val jsonText = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }.parseToJsonElement(jsonText)
                    val currentObj = json.jsonObject["current"]?.jsonObject
                    val aqiVal = currentObj?.get("us_aqi")?.jsonPrimitive?.content
                    if (aqiVal != null) {
                        aqi = aqiVal
                    }
                }
            } catch (e: Exception) {}

            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                locationLabel.text = locationName
                if (temperature != "--") temperatureText.text = temperature
                if (humidity != "--") humidityText.text = humidity
                if (aqi != "--") aqiText.text = aqi
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 3000 && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            fetchEnvironmentData()
        }
    }
}
