package com.example.myapplication

import kotlinx.serialization.Serializable

@Serializable
data class Profile(
    val id: String,
    val full_name: String? = null,
    val avatar_url: String? = null,
    val updated_at: String? = null
)

@Serializable
data class Task(
    val id: String? = null,
    val user_id: String,
    val title: String,
    val description: String? = null,
    val due_date: String? = null,
    val is_completed: Boolean = false,
    val priority: String = "Medium",
    val created_at: String? = null
)

@Serializable
data class Bill(
    val id: Long? = null,
    val user_id: String,
    val title: String,
    val amount: Double,
    val due_date: String? = null,
    val status: String = "Pending",
    val category: String? = null,
    val created_at: String? = null
)

@Serializable
data class Notification(
    val id: Long? = null,
    val user_id: String,
    val title: String,
    val message: String? = null,
    val is_read: Boolean = false,
    val created_at: String? = null
)

@Serializable
data class EnvironmentData(
    val id: Long? = null,
    val location_name: String? = null,
    val aqi: Int? = null,
    val temperature: Double? = null,
    val humidity: Double? = null,
    val recorded_at: String? = null
)

@Serializable
data class Hospital(
    val id: Long? = null,
    val name: String,
    val address: String? = null,
    val phone: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val rating: Double = 0.0,
    val created_at: String? = null
)

@Serializable
data class TransportRoute(
    val id: Long? = null,
    val route_name: String,
    val vehicle_type: String? = null,
    val departure_time: String? = null,
    val arrival_time: String? = null,
    val source: String? = null,
    val destination: String? = null,
    val fare: Double? = null
)

@Serializable
data class EmergencyContact(
    val id: Long? = null,
    val service_name: String,
    val phone_number: String,
    val category: String? = null
)
