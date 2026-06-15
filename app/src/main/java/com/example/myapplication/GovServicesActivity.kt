package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

class GovServicesActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_gov_services)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
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

        navigationView.setCheckedItem(R.id.nav_dashboard) // Or add a Gov item to menu
    }
}
