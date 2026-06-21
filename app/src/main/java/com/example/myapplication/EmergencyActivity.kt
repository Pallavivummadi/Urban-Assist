package com.example.myapplication

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class EmergencyActivity : AppCompatActivity() {

    private lateinit var contactsContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_emergency)

        contactsContainer = findViewById(R.id.contactsContainer)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val sosButton = findViewById<View>(R.id.sosButton)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        sosButton.setOnClickListener {
            Toast.makeText(this, "SOS Alert Sent to Emergency Contacts!", Toast.LENGTH_LONG).show()
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
                R.id.nav_emergency -> drawerLayout.closeDrawer(GravityCompat.START)
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

        navigationView.setCheckedItem(R.id.nav_emergency)

        fetchContacts()
    }

    private fun fetchContacts() {
        lifecycleScope.launch {
            try {
                val contacts = SupabaseManager.client.postgrest["emergency_contacts"].select().decodeList<EmergencyContact>()
                
                contactsContainer.removeAllViews()
                
                contacts.forEach { contact ->
                    val view = LayoutInflater.from(this@EmergencyActivity).inflate(R.layout.item_contact, contactsContainer, false)
                    val icon = view.findViewById<ImageView>(R.id.contactIcon)
                    val name = view.findViewById<TextView>(R.id.contactName)
                    val phone = view.findViewById<TextView>(R.id.contactPhone)
                    val callButton = view.findViewById<ImageView>(R.id.callButton)

                    name.text = contact.service_name
                    phone.text = contact.phone_number

                    // Use category-based icons/colors
                    val color = when {
                        contact.category.equals("Police", ignoreCase = true) -> android.graphics.Color.parseColor("#3498DB") // blue
                        contact.category.equals("Fire", ignoreCase = true) -> android.graphics.Color.parseColor("#E74C3C") // red
                        contact.category.equals("Ambulance", ignoreCase = true) -> android.graphics.Color.parseColor("#E67E22") // orange
                        else -> android.graphics.Color.parseColor("#1ABC9C") // green
                    }
                    icon.imageTintList = android.content.res.ColorStateList.valueOf(color)
                    callButton.imageTintList = android.content.res.ColorStateList.valueOf(color)

                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${contact.phone_number}"))
                    
                    callButton.setOnClickListener {
                        startActivity(dialIntent)
                    }
                    
                    view.setOnClickListener {
                        startActivity(dialIntent)
                    }

                    contactsContainer.addView(view)
                }
            } catch (e: Exception) {
                // Ignore or toast
            }
        }
    }
}
