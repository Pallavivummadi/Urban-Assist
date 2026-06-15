package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

class CityEventsActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_city_events)

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
                R.id.nav_environment -> {
                    startActivity(Intent(this, EnvironmentActivity::class.java))
                    finish()
                }
                R.id.nav_tasks -> {
                    startActivity(Intent(this, TasksActivity::class.java))
                    finish()
                }
                else -> Toast.makeText(this, "Opening ${menuItem.title}...", Toast.LENGTH_SHORT).show()
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }
}
