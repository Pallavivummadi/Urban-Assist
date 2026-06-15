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

class HospitalActivity : AppCompatActivity() {

    private val LOCATION_PERMISSION_REQ_CODE = 1000

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_hospital)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val mapLabel = findViewById<TextView>(R.id.mapLabel)
        
        val tabFood = findViewById<View>(R.id.tabFood)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }
        
        tabFood.setOnClickListener {
            startActivity(Intent(this, NearbyActivity::class.java))
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
        
        mapLabel.postDelayed({
            mapLabel.text = getString(R.string.hospitals_detected)
            Toast.makeText(this, "Hospitals found near your location!", Toast.LENGTH_LONG).show()
        }, 2000)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_REQ_CODE && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            detectCurrentLocation(findViewById(R.id.mapLabel))
        } else {
            Toast.makeText(this, "Permission denied. Showing general area.", Toast.LENGTH_SHORT).show()
        }
    }
}
