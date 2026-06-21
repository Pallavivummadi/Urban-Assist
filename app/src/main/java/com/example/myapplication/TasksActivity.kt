package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.google.android.material.navigation.NavigationView
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.launch

class TasksActivity : AppCompatActivity() {
    
    private lateinit var pendingContainer: LinearLayout
    private lateinit var completedContainer: LinearLayout
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tasks)

        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user == null) {
            finish()
            return
        }

        val drawerLayout = findViewById<DrawerLayout>(R.id.drawerLayout)
        val menuButton = findViewById<ImageView>(R.id.menuButton)
        val navigationView = findViewById<NavigationView>(R.id.navigationView)
        
        pendingContainer = findViewById(R.id.pendingTasksContainer)
        completedContainer = findViewById(R.id.completedTasksContainer)
        
        val taskInput = findViewById<EditText>(R.id.taskInput)
        val prioritySpinner = findViewById<Spinner>(R.id.prioritySpinner)
        val addTaskButton = findViewById<Button>(R.id.addTaskButton)

        menuButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        addTaskButton.setOnClickListener {
            val title = taskInput.text.toString().trim()
            val priority = prioritySpinner.selectedItem.toString()
            if (title.isNotEmpty()) {
                addTask(title, priority, user.id)
                taskInput.text.clear()
            }
        }

        setupNavigation(drawerLayout, navigationView)
        fetchTasks(user.id)
    }

    private fun fetchTasks(userId: String) {
        lifecycleScope.launch {
            try {
                val tasks = SupabaseManager.client.postgrest["tasks"].select {
                    filter { eq("user_id", userId) }
                }.decodeList<Task>()
                
                pendingContainer.removeAllViews()
                completedContainer.removeAllViews()
                
                tasks.forEach { task ->
                    if (task.is_completed) {
                        addListItem(completedContainer, task)
                    } else {
                        addListItem(pendingContainer, task)
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this@TasksActivity, "Error fetching tasks", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun addTask(title: String, priority: String, userId: String) {
        lifecycleScope.launch {
            try {
                val newTask = Task(user_id = userId, title = title, priority = priority)
                SupabaseManager.client.postgrest["tasks"].insert(newTask)
                fetchTasks(userId)
                Toast.makeText(this@TasksActivity, "Task added!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@TasksActivity, "Error adding task", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun toggleTask(task: Task) {
        lifecycleScope.launch {
            try {
                SupabaseManager.client.postgrest["tasks"].update({
                    set("is_completed", !task.is_completed)
                }) {
                    filter { eq("id", task.id!!) }
                }
                fetchTasks(task.user_id)
            } catch (e: Exception) {
                Toast.makeText(this@TasksActivity, "Error updating task", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun addListItem(container: LinearLayout, task: Task) {
        val view = LayoutInflater.from(this).inflate(R.layout.item_task, container, false)
        val checkBox = view.findViewById<CheckBox>(R.id.taskCheckBox)
        val priorityTag = view.findViewById<TextView>(R.id.priorityTag)
        
        checkBox.text = task.title
        checkBox.isChecked = task.is_completed
        priorityTag.text = task.priority
        
        checkBox.setOnClickListener {
            toggleTask(task)
        }
        
        container.addView(view)
    }

    private fun setupNavigation(drawerLayout: DrawerLayout, navigationView: NavigationView) {
        navigationView.setNavigationItemSelectedListener { menuItem ->
            when (menuItem.itemId) {
                R.id.nav_dashboard -> finish()
                R.id.nav_logout -> {
                    lifecycleScope.launch {
                        SupabaseManager.client.auth.signOut()
                        startActivity(Intent(this@TasksActivity, LoginActivity::class.java))
                        finishAffinity()
                    }
                }
                else -> {
                }
            }
            drawerLayout.closeDrawer(GravityCompat.START)
            true
        }
    }
}
