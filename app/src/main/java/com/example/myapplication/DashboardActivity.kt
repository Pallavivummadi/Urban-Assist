package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val searchContainer = findViewById<View>(R.id.searchContainer)
        val notificationButton = findViewById<ImageView>(R.id.notificationButton)
        val locationButton = findViewById<ImageView>(R.id.locationButton)
        val viewAllEvents = findViewById<View>(R.id.viewAllEvents)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        
        val transportAction = findViewById<View>(R.id.transportAction)
        val payBillsAction = findViewById<View>(R.id.payBillsAction)
        val foodAction = findViewById<View>(R.id.foodAction)
        val weatherAction = findViewById<View>(R.id.weatherAction)
        val myTasksAction = findViewById<View>(R.id.myTasksAction)
        val hospitalAction = findViewById<View>(R.id.hospitalAction)
        val govServicesAction = findViewById<View>(R.id.govServicesAction)
        val emergencyAction = findViewById<View>(R.id.emergencyAction)
        
        val aqiCard = findViewById<View>(R.id.aqiCard)
        val tasksCard = findViewById<View>(R.id.tasksCard)

        // Open drawer
        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        searchContainer.setOnClickListener {
            startActivity(Intent(this, SearchActivity::class.java))
        }

        notificationButton.setOnClickListener {
            startActivity(Intent(this, NotificationsActivity::class.java))
        }
        
        locationButton.setOnClickListener {
            startActivity(Intent(this, LocationActivity::class.java))
        }

        // Quick Actions
        transportAction.setOnClickListener {
            startActivity(Intent(this, TransportActivity::class.java))
        }
        
        payBillsAction.setOnClickListener {
            startActivity(Intent(this, BillsActivity::class.java))
        }

        foodAction.setOnClickListener {
            startActivity(Intent(this, NearbyActivity::class.java))
        }

        weatherAction.setOnClickListener {
            startActivity(Intent(this, EnvironmentActivity::class.java))
        }

        myTasksAction.setOnClickListener {
            startActivity(Intent(this, TasksActivity::class.java))
        }

        hospitalAction.setOnClickListener {
            startActivity(Intent(this, HospitalActivity::class.java))
        }

        govServicesAction.setOnClickListener {
            startActivity(Intent(this, GovServicesActivity::class.java))
        }

        emergencyAction.setOnClickListener {
            startActivity(Intent(this, EmergencyActivity::class.java))
        }

        aqiCard.setOnClickListener {
            startActivity(Intent(this, EnvironmentActivity::class.java))
        }

        tasksCard.setOnClickListener {
            startActivity(Intent(this, TasksActivity::class.java))
        }

        // Handle sidebar item clicks
        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> Toast.makeText(this, "Already on Dashboard", Toast.LENGTH_SHORT).show()
                R.id.nav_transport -> startActivity(Intent(this, TransportActivity::class.java))
                R.id.nav_bills -> startActivity(Intent(this, BillsActivity::class.java))
                R.id.nav_nearby -> startActivity(Intent(this, NearbyActivity::class.java))
                R.id.nav_emergency -> startActivity(Intent(this, EmergencyActivity::class.java))
                R.id.nav_environment -> startActivity(Intent(this, EnvironmentActivity::class.java))
                R.id.nav_tasks -> startActivity(Intent(this, TasksActivity::class.java))
                R.id.nav_gov -> startActivity(Intent(this, GovServicesActivity::class.java))
                R.id.nav_location -> startActivity(Intent(this, LocationActivity::class.java))
                R.id.nav_settings -> startActivity(Intent(this, SettingsActivity::class.java))
                else -> Toast.makeText(this, "Opening ${menuItem.title}...", Toast.LENGTH_SHORT).show()
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }

    override fun onBackPressed() {
        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START)
        } else {
            super.onBackPressed()
        }
    }
}
