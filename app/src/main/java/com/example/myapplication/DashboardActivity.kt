package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val searchContainer = findViewById<View>(R.id.searchContainer)
        val notificationButton = findViewById<ImageView>(R.id.notificationButton)
        val locationButton = findViewById<ImageView>(R.id.locationButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        
        val greetingText = findViewById<TextView>(R.id.greetingText)
        
        greetingText.text = "Hello, ${user.email?.substringBefore("@") ?: "User"}"

        setupNavigation(drawerLayout, menuButton, searchContainer, notificationButton, locationButton, navigationView)
        fetchDashboardData()
    }

    private fun setupNavigation(
        drawerLayout: DrawerLayout,
        menuButton: ImageView,
        searchContainer: View,
        notificationButton: ImageView,
        locationButton: ImageView,
        navigationView: NavigationView
    ) {
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

        findViewById<View>(R.id.transportAction).setOnClickListener {
            startActivity(Intent(this, TransportActivity::class.java))
        }
        
        findViewById<View>(R.id.payBillsAction).setOnClickListener {
            startActivity(Intent(this, BillsActivity::class.java))
        }

        findViewById<View>(R.id.foodAction).setOnClickListener {
            startActivity(Intent(this, NearbyActivity::class.java))
        }

        findViewById<View>(R.id.weatherAction).setOnClickListener {
            startActivity(Intent(this, EnvironmentActivity::class.java))
        }

        findViewById<View>(R.id.myTasksAction).setOnClickListener {
            startActivity(Intent(this, TasksActivity::class.java))
        }

        findViewById<View>(R.id.hospitalAction).setOnClickListener {
            startActivity(Intent(this, HospitalActivity::class.java))
        }

        findViewById<View>(R.id.govServicesAction).setOnClickListener {
            startActivity(Intent(this, GovServicesActivity::class.java))
        }

        findViewById<View>(R.id.emergencyAction).setOnClickListener {
            startActivity(Intent(this, EmergencyActivity::class.java))
        }

        findViewById<View>(R.id.aqiCard).setOnClickListener {
            startActivity(Intent(this, EnvironmentActivity::class.java))
        }

        findViewById<View>(R.id.tasksCard).setOnClickListener {
            startActivity(Intent(this, TasksActivity::class.java))
        }

        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> Toast.makeText(this, "Already on Dashboard", Toast.LENGTH_SHORT).show()
                R.id.nav_logout -> {
                    lifecycleScope.launch {
                        SupabaseManager.client.auth.signOut()
                        startActivity(Intent(this@DashboardActivity, LoginActivity::class.java))
                        finish()
                    }
                }
                else -> {
                    val activityClass = when (menuItem.itemId) {
                        R.id.nav_transport -> TransportActivity::class.java
                        R.id.nav_bills -> BillsActivity::class.java
                        R.id.nav_nearby -> NearbyActivity::class.java
                        R.id.nav_emergency -> EmergencyActivity::class.java
                        R.id.nav_environment -> EnvironmentActivity::class.java
                        R.id.nav_tasks -> TasksActivity::class.java
                        R.id.nav_gov -> GovServicesActivity::class.java
                        R.id.nav_location -> LocationActivity::class.java
                        R.id.nav_settings -> SettingsActivity::class.java
                        else -> null
                    }
                    activityClass?.let { startActivity(Intent(this, it)) }
                }
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }

    private fun fetchDashboardData() {
        val user = SupabaseManager.client.auth.currentUserOrNull() ?: return
        
        lifecycleScope.launch {
            try {
                // Fetch Tasks Count
                val tasks = SupabaseManager.client.postgrest["tasks"].select {
                    filter {
                        eq("user_id", user.id)
                        eq("is_completed", false)
                    }
                }.decodeList<Task>()
                findViewById<TextView>(R.id.taskCountVal).text = tasks.size.toString()
                
                // Fetch Bills Total
                val bills = SupabaseManager.client.postgrest["bills"].select {
                    filter {
                        eq("user_id", user.id)
                        eq("status", "Pending")
                    }
                }.decodeList<Bill>()
                findViewById<TextView>(R.id.billsTotalVal).text = "₹${bills.sumOf { it.amount }}"

                // Fetch Environment Data
                val envData = SupabaseManager.client.postgrest["environment_data"].select().decodeSingleOrNull<EnvironmentData>()
                envData?.let {
                    findViewById<TextView>(R.id.aqiVal).text = it.aqi.toString()
                }
                
            } catch (e: Exception) {
                // Ignore errors or log them
            }
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
