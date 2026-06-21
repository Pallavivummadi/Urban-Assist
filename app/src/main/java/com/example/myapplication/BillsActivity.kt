package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
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

class BillsActivity : AppCompatActivity() {

    private lateinit var billsContainer: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_bills)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            finish()
            return
        }

        billsContainer = findViewById(R.id.billsContainer)

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        val addBillButton = findViewById<View>(R.id.addBillButton)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        addBillButton.setOnClickListener {
            showAddBillDialog(user.id)
        }

        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> finish()
                R.id.nav_transport -> {
                    startActivity(Intent(this, TransportActivity::class.java))
                    finish()
                }
                R.id.nav_bills -> drawerLayout.closeDrawer(GravityCompat.START)
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
        
        navigationView.setCheckedItem(R.id.nav_bills)

        fetchBills(user.id)
    }

    private fun fetchBills(userId: String) {
        lifecycleScope.launch {
            try {
                val bills = SupabaseManager.client.postgrest["bills"].select {
                    filter { eq("user_id", userId) }
                }.decodeList<Bill>()

                val paidBills = bills.filter { it.status.equals("Paid", ignoreCase = true) }
                val dueBills = bills.filter { it.status.equals("Pending", ignoreCase = true) || it.status.equals("Due", ignoreCase = true) }
                val overdueBills = bills.filter { it.status.equals("Overdue", ignoreCase = true) }

                val totalPaid = paidBills.sumOf { it.amount }
                val totalDue = dueBills.sumOf { it.amount }
                val totalOverdue = overdueBills.sumOf { it.amount }

                findViewById<TextView>(R.id.paidAmountVal).text = "₹${totalPaid.toInt()}"
                findViewById<TextView>(R.id.paidCountVal).text = "${paidBills.size} bills paid"

                findViewById<TextView>(R.id.dueAmountVal).text = "₹${totalDue.toInt()}"
                findViewById<TextView>(R.id.dueCountVal).text = "${dueBills.size} bills pending"

                findViewById<TextView>(R.id.overdueAmountVal).text = "₹${totalOverdue.toInt()}"
                findViewById<TextView>(R.id.overdueCountVal).text = "${overdueBills.size} bill overdue"

                billsContainer.removeAllViews()

                bills.forEach { bill ->
                    val view = LayoutInflater.from(this@BillsActivity).inflate(R.layout.item_bill, billsContainer, false)
                    val billIcon = view.findViewById<ImageView>(R.id.billIcon)
                    val billTitle = view.findViewById<TextView>(R.id.billTitle)
                    val billDueDate = view.findViewById<TextView>(R.id.billDueDate)
                    val billAmountAndStatus = view.findViewById<TextView>(R.id.billAmountAndStatus)
                    val payButton = view.findViewById<Button>(R.id.payButton)

                    billTitle.text = bill.title
                    billDueDate.text = "Due: ${bill.due_date ?: "N/A"}"
                    
                    val statusText = when {
                        bill.status.equals("Paid", ignoreCase = true) -> "Paid"
                        bill.status.equals("Overdue", ignoreCase = true) -> "Overdue"
                        else -> "Due"
                    }
                    
                    billAmountAndStatus.text = "₹${bill.amount.toInt()}\n$statusText"
                    
                    val color = when {
                        bill.status.equals("Paid", ignoreCase = true) -> android.graphics.Color.parseColor("#2ECC71") // green
                        bill.status.equals("Overdue", ignoreCase = true) -> android.graphics.Color.parseColor("#E74C3C") // red
                        else -> android.graphics.Color.parseColor("#F1C40F") // yellow
                    }
                    
                    billIcon.imageTintList = android.content.res.ColorStateList.valueOf(color)
                    
                    if (bill.status.equals("Paid", ignoreCase = true)) {
                        payButton.text = "Paid"
                        payButton.isEnabled = false
                        payButton.alpha = 0.5f
                    } else {
                        payButton.text = if (bill.status.equals("Overdue", ignoreCase = true)) "Pay Now" else "Pay"
                        payButton.isEnabled = true
                        payButton.alpha = 1.0f
                        payButton.setOnClickListener {
                            payBill(bill)
                        }
                    }
                    
                    billsContainer.addView(view)
                }
            } catch (e: Exception) {
                Toast.makeText(this@BillsActivity, "Error fetching bills", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun payBill(bill: Bill) {
        lifecycleScope.launch {
            try {
                SupabaseManager.client.postgrest["bills"].update({
                    set("status", "Paid")
                }) {
                    filter { eq("id", bill.id!!) }
                }
                Toast.makeText(this@BillsActivity, "Bill Paid Successfully!", Toast.LENGTH_SHORT).show()
                fetchBills(bill.user_id)
            } catch (e: Exception) {
                Toast.makeText(this@BillsActivity, "Error paying bill: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showAddBillDialog(userId: String) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_bill, null)
        val titleInput = dialogView.findViewById<EditText>(R.id.dialogTitleInput)
        val amountInput = dialogView.findViewById<EditText>(R.id.dialogAmountInput)
        val categoryInput = dialogView.findViewById<EditText>(R.id.dialogCategoryInput)
        val dateInput = dialogView.findViewById<EditText>(R.id.dialogDateInput)
        
        android.app.AlertDialog.Builder(this)
            .setTitle("Add New Bill")
            .setView(dialogView)
            .setPositiveButton("Add") { dialog, _ ->
                val title = titleInput.text.toString().trim()
                val amountStr = amountInput.text.toString().trim()
                val category = categoryInput.text.toString().trim()
                val date = dateInput.text.toString().trim()
                
                if (title.isNotEmpty() && amountStr.isNotEmpty()) {
                    val amount = amountStr.toDoubleOrNull() ?: 0.0
                    addBill(userId, title, amount, category, date)
                } else {
                    Toast.makeText(this, "Title and Amount are required", Toast.LENGTH_SHORT).show()
                }
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }

    private fun addBill(userId: String, title: String, amount: Double, category: String, date: String) {
        lifecycleScope.launch {
            try {
                val newBill = Bill(
                    user_id = userId,
                    title = title,
                    amount = amount,
                    due_date = if (date.isNotEmpty()) date else null,
                    category = if (category.isNotEmpty()) category else null,
                    status = "Pending"
                )
                SupabaseManager.client.postgrest["bills"].insert(newBill)
                Toast.makeText(this@BillsActivity, "Bill Added!", Toast.LENGTH_SHORT).show()
                fetchBills(userId)
            } catch (e: Exception) {
                Toast.makeText(this@BillsActivity, "Error adding bill: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
