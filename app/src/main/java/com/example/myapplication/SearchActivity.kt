package com.example.myapplication

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
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

class SearchActivity : AppCompatActivity() {

    private lateinit var searchQueryInput: EditText
    private lateinit var resultsFoundText: TextView
    
    private lateinit var servicesHeaderLayout: View
    private lateinit var servicesListContainer: LinearLayout
    private lateinit var resultTransport: View
    private lateinit var resultHospital: View
    private lateinit var transportSeparator: View

    private lateinit var tasksHeaderLayout: View
    private lateinit var tasksListContainer: LinearLayout

    private lateinit var billsHeaderLayout: View
    private lateinit var billsListContainer: LinearLayout

    private lateinit var infoHeaderText: TextView
    private lateinit var infoListContainer: LinearLayout
    private lateinit var infoItem1: View
    private lateinit var infoItem2: View
    private lateinit var infoSeparator: View

    private var allTasks: List<Task> = emptyList()
    private var allBills: List<Bill> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        // Initialize Views
        searchQueryInput = findViewById(R.id.searchQueryInput)
        resultsFoundText = findViewById(R.id.resultsFoundText)

        servicesHeaderLayout = findViewById(R.id.servicesHeaderLayout)
        servicesListContainer = findViewById(R.id.servicesListContainer)
        resultTransport = findViewById(R.id.resultTransport)
        resultHospital = findViewById(R.id.resultHospital)
        // Transport separator is the second child in servicesListContainer (index 1)
        transportSeparator = servicesListContainer.getChildAt(1)

        tasksHeaderLayout = findViewById(R.id.tasksHeaderLayout)
        tasksListContainer = findViewById(R.id.tasksListContainer)

        billsHeaderLayout = findViewById(R.id.billsHeaderLayout)
        billsListContainer = findViewById(R.id.billsListContainer)

        infoHeaderText = findViewById(R.id.infoHeaderText)
        infoListContainer = findViewById(R.id.infoListContainer)
        
        val infoIcon1 = findViewById<ImageView>(R.id.infoIcon1)
        val infoIcon2 = findViewById<ImageView>(R.id.infoIcon2)
        infoItem1 = infoIcon1.parent as View
        infoItem2 = infoIcon2.parent as View
        // Info separator is the second child in infoListContainer (index 1)
        infoSeparator = infoListContainer.getChildAt(1)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        // Setup Drawer Navigation
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

        // View All Buttons/Redirects
        findViewById<TextView>(R.id.viewAllBills).setOnClickListener {
            startActivity(Intent(this, BillsActivity::class.java))
        }

        // Setup Search Listener
        searchQueryInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                performSearch(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // On clicks for services
        resultTransport.setOnClickListener {
            startActivity(Intent(this, TransportActivity::class.java))
        }
        resultHospital.setOnClickListener {
            startActivity(Intent(this, HospitalActivity::class.java))
        }

        // Load data on startup
        loadTasksAndBills(user.id)
    }

    private fun loadTasksAndBills(userId: String) {
        lifecycleScope.launch {
            try {
                // Fetch Tasks
                allTasks = SupabaseManager.client.postgrest["tasks"].select {
                    filter { eq("user_id", userId) }
                }.decodeList<Task>()

                // Fetch Bills
                allBills = SupabaseManager.client.postgrest["bills"].select {
                    filter { eq("user_id", userId) }
                }.decodeList<Bill>()

                performSearch(searchQueryInput.text.toString())
            } catch (e: Exception) {
                // Log/Toast error
                Toast.makeText(this@SearchActivity, "Failed to load database items", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun toggleTask(task: Task) {
        val user = SupabaseManager.client.auth.currentUserOrNull() ?: return
        lifecycleScope.launch {
            try {
                SupabaseManager.client.postgrest["tasks"].update({
                    set("is_completed", !task.is_completed)
                }) {
                    filter { eq("id", task.id!!) }
                }
                // Reload and re-search
                loadTasksAndBills(user.id)
            } catch (e: Exception) {
                Toast.makeText(this@SearchActivity, "Error updating task", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun performSearch(query: String) {
        val q = query.trim().lowercase()
        var totalResultsCount = 0

        // 1. Services Filtering
        val showTransport = q.isEmpty() || 
                "transport".contains(q) || "transit".contains(q) || "bus".contains(q) || 
                "metro".contains(q) || "cab".contains(q) || "auto".contains(q) || 
                "bike".contains(q) || "route".contains(q) || "planner".contains(q)
        
        val showHospital = q.isEmpty() || 
                "hospital".contains(q) || "clinic".contains(q) || "health".contains(q) || 
                "doctor".contains(q) || "medical".contains(q) || "emergency".contains(q) || 
                "pharmacy".contains(q) || "medicine".contains(q)

        resultTransport.visibility = if (showTransport) View.VISIBLE else View.GONE
        resultHospital.visibility = if (showHospital) View.VISIBLE else View.GONE
        transportSeparator.visibility = if (showTransport && showHospital) View.VISIBLE else View.GONE

        if (showTransport) totalResultsCount++
        if (showHospital) totalResultsCount++

        if (!showTransport && !showHospital) {
            servicesHeaderLayout.visibility = View.GONE
            servicesListContainer.visibility = View.GONE
        } else {
            servicesHeaderLayout.visibility = View.VISIBLE
            servicesListContainer.visibility = View.VISIBLE
        }

        // 2. Tasks Filtering
        tasksListContainer.removeAllViews()
        val filteredTasks = allTasks.filter { it.title.lowercase().contains(q) }
        
        if (filteredTasks.isEmpty()) {
            tasksHeaderLayout.visibility = View.GONE
            tasksListContainer.visibility = View.GONE
        } else {
            tasksHeaderLayout.visibility = View.VISIBLE
            tasksListContainer.visibility = View.VISIBLE
            filteredTasks.forEach { task ->
                totalResultsCount++
                val taskView = LayoutInflater.from(this).inflate(R.layout.item_task, tasksListContainer, false)
                val checkBox = taskView.findViewById<CheckBox>(R.id.taskCheckBox)
                val priorityTag = taskView.findViewById<TextView>(R.id.priorityTag)

                checkBox.text = task.title
                checkBox.isChecked = task.is_completed
                priorityTag.text = task.priority

                // Format priority tag styling
                when (task.priority.lowercase()) {
                    "high" -> {
                        priorityTag.setTextColor(Color.parseColor("#E74C3C"))
                        priorityTag.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#FDEDEC"))
                    }
                    "medium" -> {
                        priorityTag.setTextColor(Color.parseColor("#F1C40F"))
                        priorityTag.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#FEF9E7"))
                    }
                    else -> {
                        priorityTag.setTextColor(Color.parseColor("#2ECC71"))
                        priorityTag.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E8F8F5"))
                    }
                }

                checkBox.setOnClickListener {
                    toggleTask(task)
                }
                tasksListContainer.addView(taskView)
            }
        }

        // 3. Bills Filtering
        billsListContainer.removeAllViews()
        val filteredBills = allBills.filter { 
            it.title.lowercase().contains(q) || (it.category ?: "").lowercase().contains(q)
        }

        if (filteredBills.isEmpty()) {
            billsHeaderLayout.visibility = View.GONE
            billsListContainer.visibility = View.GONE
        } else {
            billsHeaderLayout.visibility = View.VISIBLE
            billsListContainer.visibility = View.VISIBLE
            filteredBills.forEach { bill ->
                totalResultsCount++
                val billView = LayoutInflater.from(this).inflate(R.layout.item_bill, billsListContainer, false)
                val billIcon = billView.findViewById<ImageView>(R.id.billIcon)
                val billTitle = billView.findViewById<TextView>(R.id.billTitle)
                val billDueDate = billView.findViewById<TextView>(R.id.billDueDate)
                val billAmountAndStatus = billView.findViewById<TextView>(R.id.billAmountAndStatus)
                val payButton = billView.findViewById<Button>(R.id.payButton)

                billTitle.text = bill.title
                billDueDate.text = "Due: ${bill.due_date ?: "N/A"}"
                
                val uiStatus = if (bill.status.equals("Paid", ignoreCase = true)) "Paid" else "Pending"
                billAmountAndStatus.text = "₹${bill.amount.toInt()}\n$uiStatus"

                // Category based icons & colors
                val cat = (bill.category ?: "").lowercase()
                val (iconRes, colorStr) = when {
                    cat.contains("elect") || cat.contains("power") -> Pair(android.R.drawable.ic_menu_compass, "#F1C40F")
                    cat.contains("water") -> Pair(android.R.drawable.ic_menu_compass, "#3498DB")
                    cat.contains("phone") || cat.contains("mobile") -> Pair(android.R.drawable.ic_menu_call, "#27AE60")
                    else -> Pair(android.R.drawable.ic_menu_save, "#8E44AD")
                }
                billIcon.setImageResource(iconRes)
                billIcon.imageTintList = ColorStateList.valueOf(Color.parseColor(colorStr))
                billIcon.backgroundTintList = ColorStateList.valueOf(Color.parseColor(colorStr)).withAlpha(30)

                if (uiStatus == "Paid") {
                    payButton.visibility = View.GONE
                    billAmountAndStatus.setTextColor(Color.parseColor("#2ECC71"))
                } else {
                    payButton.visibility = View.VISIBLE
                    billAmountAndStatus.setTextColor(Color.parseColor("#E74C3C"))
                    payButton.setOnClickListener {
                        Toast.makeText(this@SearchActivity, "Opening bills portal...", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@SearchActivity, BillsActivity::class.java))
                    }
                }
                billsListContainer.addView(billView)
            }
        }

        // 4. Info Filtering
        val showInfo1 = q.isEmpty() || "health safety tips".contains(q) || "city health".contains(q) || "safety tips".contains(q)
        val showInfo2 = q.isEmpty() || "smart city expo".contains(q) || "expo schedule".contains(q) || "schedule".contains(q)

        infoItem1.visibility = if (showInfo1) View.VISIBLE else View.GONE
        infoItem2.visibility = if (showInfo2) View.VISIBLE else View.GONE
        infoSeparator.visibility = if (showInfo1 && showInfo2) View.VISIBLE else View.GONE

        if (showInfo1) totalResultsCount++
        if (showInfo2) totalResultsCount++

        if (!showInfo1 && !showInfo2) {
            infoHeaderText.visibility = View.GONE
            infoListContainer.visibility = View.GONE
        } else {
            infoHeaderText.visibility = View.VISIBLE
            infoListContainer.visibility = View.VISIBLE
        }

        // 5. Update Count Label
        resultsFoundText.text = "$totalResultsCount results found"
    }
}
