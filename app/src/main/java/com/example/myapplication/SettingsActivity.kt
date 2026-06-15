package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

class SettingsActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val signOutButton = findViewById<Button>(R.id.signOutButton)
        val feedbackButton = findViewById<Button>(R.id.feedbackButton)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        feedbackButton.setOnClickListener {
            startActivity(Intent(this, FeedbackActivity::class.java))
        }

        signOutButton.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
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
                R.id.nav_settings -> drawerLayout.closeDrawer(GravityCompat.START)
                else -> Toast.makeText(this, "Opening ${menuItem.title}...", Toast.LENGTH_SHORT).show()
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }

        navigationView.setCheckedItem(R.id.nav_settings)
    }
}
