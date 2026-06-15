package com.example.myapplication

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class ForgotPasswordActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)

        val emailEditText = findViewById<EditText>(R.id.emailEditText)
        val resetButton = findViewById<View>(R.id.resetButton)
        val backToLoginTextView = findViewById<TextView>(R.id.backToLoginTextView)

        resetButton.setOnClickListener {
            val email = emailEditText.text.toString()

            if (email.isNotEmpty()) {
                Toast.makeText(this, "Reset link sent to $email", Toast.LENGTH_LONG).show()
                // Proceed with reset logic
                finish()
            } else {
                Toast.makeText(this, "Please enter your email", Toast.LENGTH_SHORT).show()
            }
        }

        backToLoginTextView.setOnClickListener {
            finish()
        }
    }
}
