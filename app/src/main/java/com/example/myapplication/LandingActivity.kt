package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import io.github.jan.supabase.auth.auth

class LandingActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if user is already signed in — skip landing and go to Dashboard
        val currentUser = SupabaseManager.client.auth.currentUserOrNull()
        if (currentUser != null) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_landing)

        val getStartedButton = findViewById<Button>(R.id.getStartedButton)
        val loginLink = findViewById<TextView>(R.id.loginLink)

        getStartedButton.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        loginLink.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }
    }
}
