
package com.example.myapplication

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

object SupabaseManager {
    private const val SUPABASE_URL = "https://eiflobzhavpudfwcrtre.supabase.co"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZmxvYnpoYXZwdWRmd2NydHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTYzNTMsImV4cCI6MjA5NzE3MjM1M30.QKjc5SjqP6AFSFrL4BInvHqKRHIO9NS8vhM0Zy8jKtk"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Auth)
        install(Postgrest)
        install(Realtime)
    }
}
