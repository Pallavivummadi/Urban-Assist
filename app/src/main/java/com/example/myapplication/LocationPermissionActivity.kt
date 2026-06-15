package com.example.myapplication

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat

class LocationPermissionActivity : AppCompatActivity() {

    private val LOCATION_PERMISSION_REQ_CODE = 2000

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_location_permission)

        val btnWhileUsing = findViewById<TextView>(R.id.btnWhileUsing)
        val btnOnlyThisTime = findViewById<TextView>(R.id.btnOnlyThisTime)
        val btnDontAllow = findViewById<TextView>(R.id.btnDontAllowLocation)

        btnWhileUsing.setOnClickListener {
            requestLocationPermissions()
        }

        btnOnlyThisTime.setOnClickListener {
            requestLocationPermissions()
        }

        btnDontAllow.setOnClickListener {
            navigateToDashboard()
        }
    }

    private fun requestLocationPermissions() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            LOCATION_PERMISSION_REQ_CODE
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // Transition to dashboard regardless of choice for demo flow
        navigateToDashboard()
    }

    private fun navigateToDashboard() {
        startActivity(Intent(this, DashboardActivity::class.java))
        finish()
    }
}
