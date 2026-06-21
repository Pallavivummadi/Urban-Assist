package com.example.myapplication

import android.content.Intent
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
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class NotificationsActivity : AppCompatActivity() {

    private lateinit var recentContainer: LinearLayout
    private lateinit var earlierContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            finish()
            return
        }

        recentContainer = findViewById(R.id.recentNotificationsContainer)
        earlierContainer = findViewById(R.id.earlierNotificationsContainer)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val backButton = findViewById<ImageView>(R.id.backButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val clearAll = findViewById<TextView>(R.id.clearAll)

        backButton.setOnClickListener {
            finish()
        }

        clearAll.setOnClickListener {
            clearNotifications(user.id)
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

        fetchNotifications(user.id)
    }

    private fun fetchNotifications(userId: String) {
        lifecycleScope.launch {
            try {
                // Fetch notifications
                var notifications = SupabaseManager.client.postgrest["notifications"].select {
                    filter { eq("user_id", userId) }
                }.decodeList<Notification>()

                // Auto-populate default notifications if empty
                if (notifications.isEmpty()) {
                    val defaults = listOf(
                        Notification(
                            user_id = userId,
                            title = "Transit Alert",
                            message = "Green Line metro reports 5 mins delay at Ambattur.",
                            is_read = false
                        ),
                        Notification(
                            user_id = userId,
                            title = "Bill Reminder",
                            message = "Your electricity bill of ₹2,450 is due in 3 days.",
                            is_read = false
                        ),
                        Notification(
                            user_id = userId,
                            title = "System Update",
                            message = "UrbanAssist has been updated to version 3.1.0.",
                            is_read = false
                        )
                    )
                    defaults.forEach {
                        SupabaseManager.client.postgrest["notifications"].insert(it)
                    }
                    // Fetch again after inserting defaults
                    notifications = SupabaseManager.client.postgrest["notifications"].select {
                        filter { eq("user_id", userId) }
                    }.decodeList<Notification>()
                }

                val sortedNotifs = notifications.sortedByDescending { it.id ?: 0L }

                recentContainer.removeAllViews()
                earlierContainer.removeAllViews()

                // Display recent section (e.g. first 2 items), rest under earlier
                sortedNotifs.forEachIndexed { index, notification ->
                    val container = if (index < 2) recentContainer else earlierContainer
                    val view = LayoutInflater.from(this@NotificationsActivity).inflate(R.layout.item_notification, container, false)
                    
                    val icon = view.findViewById<ImageView>(R.id.notifIcon)
                    val title = view.findViewById<TextView>(R.id.notifTitle)
                    val message = view.findViewById<TextView>(R.id.notifMessage)
                    val timeText = view.findViewById<TextView>(R.id.notifTime)

                    title.text = notification.title
                    message.text = notification.message ?: ""
                    
                    // Format time
                    timeText.text = if (index < 2) "Just now" else "Earlier"

                    // Use category-based colors
                    val color = when {
                        notification.title.contains("Transit", ignoreCase = true) -> android.graphics.Color.parseColor("#3498DB") // blue
                        notification.title.contains("Bill", ignoreCase = true) -> android.graphics.Color.parseColor("#F1C40F") // yellow
                        else -> android.graphics.Color.parseColor("#8E44AD") // purple
                    }
                    icon.imageTintList = android.content.res.ColorStateList.valueOf(color)
                    icon.backgroundTintList = android.content.res.ColorStateList.valueOf(color).withAlpha(30)

                    container.addView(view)
                }
            } catch (e: Exception) {
                // ignore or log
            }
        }
    }

    private fun clearNotifications(userId: String) {
        lifecycleScope.launch {
            try {
                SupabaseManager.client.postgrest["notifications"].delete {
                    filter { eq("user_id", userId) }
                }
                Toast.makeText(this@NotificationsActivity, "Notifications Cleared", Toast.LENGTH_SHORT).show()
                fetchNotifications(userId)
            } catch (e: Exception) {
                Toast.makeText(this@NotificationsActivity, "Error clearing notifications: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
