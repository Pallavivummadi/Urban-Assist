package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {

    private lateinit var nameInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var phoneInput: EditText
    private lateinit var addressInput: EditText
    
    private lateinit var avatarInitials: TextView
    private lateinit var nameLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            finish()
            return
        }

        nameInput = findViewById(R.id.nameInput)
        emailInput = findViewById(R.id.emailInput)
        phoneInput = findViewById(R.id.phoneInput)
        addressInput = findViewById(R.id.addressInput)
        
        avatarInitials = findViewById(R.id.avatarInitials)
        nameLabel = findViewById(R.id.nameLabel)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val signOutButton = findViewById<Button>(R.id.signOutButton)
        val feedbackButton = findViewById<Button>(R.id.feedbackButton)
        val saveChangesButton = findViewById<View>(R.id.saveChangesButton)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        feedbackButton.setOnClickListener {
            startActivity(Intent(this, FeedbackActivity::class.java))
        }

        signOutButton.setOnClickListener {
            lifecycleScope.launch {
                try {
                    SupabaseManager.client.auth.signOut()
                    val intent = Intent(this@SettingsActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                } catch (e: Exception) {
                    Toast.makeText(this@SettingsActivity, "Sign out error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        saveChangesButton.setOnClickListener {
            saveChanges(user.id)
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

        loadProfile(user.id, user.email ?: "")
    }

    private fun loadProfile(userId: String, email: String) {
        emailInput.setText(email)
        
        lifecycleScope.launch {
            try {
                val profile = SupabaseManager.client.postgrest["profiles"].select {
                    filter { eq("id", userId) }
                }.decodeSingleOrNull<Profile>()

                profile?.full_name?.let { name ->
                    nameInput.setText(name)
                    nameLabel.text = name
                    avatarInitials.text = getInitials(name)
                }
            } catch (e: Exception) {
                // profile fetch error, fallback to defaults
            }
        }
    }

    private fun saveChanges(userId: String) {
        val newName = nameInput.text.toString().trim()
        if (newName.isEmpty()) {
            Toast.makeText(this, "Name cannot be empty", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                SupabaseManager.client.postgrest["profiles"].update({
                    set("full_name", newName)
                }) {
                    filter { eq("id", userId) }
                }
                
                nameLabel.text = newName
                avatarInitials.text = getInitials(newName)
                Toast.makeText(this@SettingsActivity, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@SettingsActivity, "Error saving changes: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun getInitials(name: String): String {
        val parts = name.split(" ")
        return when {
            parts.size >= 2 -> "${parts[0].take(1)}${parts[1].take(1)}".uppercase()
            parts.isNotEmpty() -> parts[0].take(2).uppercase()
            else -> "UA"
        }
    }
}
