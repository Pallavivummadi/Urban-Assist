package com.example.myapplication

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)

        val emailEditText = findViewById<EditText>(R.id.emailEditText)
        val resetButton = findViewById<View>(R.id.resetButton)
        val backToLoginTextView = findViewById<TextView>(R.id.backToLoginTextView)

        resetButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()

            if (email.isNotEmpty()) {
                resetButton.isEnabled = false
                lifecycleScope.launch {
                    try {
                        SupabaseManager.client.auth.resetPasswordForEmail(email)
                        Toast.makeText(this@ForgotPasswordActivity, "Reset link sent to $email", Toast.LENGTH_LONG).show()
                        finish()
                    } catch (e: Exception) {
                        resetButton.isEnabled = true
                        Toast.makeText(this@ForgotPasswordActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            } else {
                Toast.makeText(this, "Please enter your email", Toast.LENGTH_SHORT).show()
            }
        }

        backToLoginTextView.setOnClickListener {
            finish()
        }
    }
}
