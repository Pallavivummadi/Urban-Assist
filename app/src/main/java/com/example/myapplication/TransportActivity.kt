package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

class TransportActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_transport)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)

        val tabMetro = findViewById<TextView>(R.id.tabMetro)
        val tabBus = findViewById<TextView>(R.id.tabBus)
        val metroSection = findViewById<View>(R.id.metroSection)
        val busSection = findViewById<View>(R.id.busSection)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        tabMetro.setOnClickListener {
            switchToMetro(tabMetro, tabBus, metroSection, busSection)
        }

        tabBus.setOnClickListener {
            switchToBus(tabMetro, tabBus, metroSection, busSection)
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
    }

    private fun switchToMetro(tabMetro: TextView, tabBus: TextView, metroSection: View, busSection: View) {
        metroSection.visibility = View.VISIBLE
        busSection.visibility = View.GONE
        
        tabMetro.setBackgroundResource(R.drawable.tab_item_selected_bg)
        tabMetro.setTextColor(ContextCompat.getColor(this, R.color.sidebar_bg))
        tabMetro.setTypeface(null, android.graphics.Typeface.BOLD)
        
        tabBus.setBackgroundResource(0)
        tabBus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
        tabBus.setTypeface(null, android.graphics.Typeface.NORMAL)
    }

    private fun switchToBus(tabMetro: TextView, tabBus: TextView, metroSection: View, busSection: View) {
        metroSection.visibility = View.GONE
        busSection.visibility = View.VISIBLE
        
        tabBus.setBackgroundResource(R.drawable.tab_item_selected_bg)
        tabBus.setTextColor(ContextCompat.getColor(this, R.color.sidebar_bg))
        tabBus.setTypeface(null, android.graphics.Typeface.BOLD)
        
        tabMetro.setBackgroundResource(0)
        tabMetro.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
        tabMetro.setTypeface(null, android.graphics.Typeface.NORMAL)
    }
}
