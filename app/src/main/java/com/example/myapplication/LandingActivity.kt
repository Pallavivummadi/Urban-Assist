package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class LandingActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
