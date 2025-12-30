// ==================== ADMIN LOGIN ====================

document.addEventListener('DOMContentLoaded', function() {
    // Admin Login Form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
        
        // Toggle password visibility
        const toggleBtn = document.querySelector('.toggle-password');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', togglePassword);
        }
    }
    
    // Dashboard functionality
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshUsers);
    }
    
    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', openCreateModal);
    }
    
    // Create form
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateSubmit);
        
        // Máscara de CPF no input de criação
        const createCpfInput = document.getElementById('createCpf');
        if (createCpfInput) {
            createCpfInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    e.target.value = value;
                }
            });
        }
    }
    
    // Edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
        
        // Currency input formatting
        const salesInput = document.getElementById('editSales');
        const goalInput = document.getElementById('editGoal');
        
        if (salesInput) {
            salesInput.addEventListener('input', formatCurrencyInput);
            salesInput.addEventListener('blur', formatCurrencyBlur);
        }
        
        if (goalInput) {
            goalInput.addEventListener('input', formatCurrencyInput);
            goalInput.addEventListener('blur', formatCurrencyBlur);
        }
    }
});

// ==================== LOGIN FUNCTIONS ====================

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.classList.add('loading');
    
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            setTimeout(() => {
                window.location.href = data.redirect || '/admin/dashboard';
            }, 1000);
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Erro ao conectar com o servidor!', 'error');
    } finally {
        submitBtn.classList.remove('loading');
    }
}

function togglePassword() {
    const input = this.parentElement.querySelector('input');
    const eyeOpen = this.querySelector('.eye-open');
    const eyeClosed = this.querySelector('.eye-closed');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        input.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

// ==================== DASHBOARD FUNCTIONS ====================

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('show');
    mainContent.classList.toggle('expanded');
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('.user-name')?.textContent.toLowerCase() || '';
        const cpf = row.querySelector('.user-cpf')?.textContent.toLowerCase() || '';
        const coupon = row.querySelector('.coupon-badge')?.textContent.toLowerCase() || '';
        
        if (name.includes(searchTerm) || cpf.includes(searchTerm) || coupon.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function refreshUsers() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Atualizando...
    `;
    
    try {
        const response = await fetch('/admin/api/users', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            // Tentar parsear erro JSON
            try {
                const errorData = await response.json();
                showToast(errorData.message || 'Erro ao carregar dados!', 'error');
                // Se for erro de autenticação, redirecionar para login
                if (response.status === 401 || response.status === 403) {
                    // Fazer logout e redirecionar imediatamente
                    fetch('/admin/logout', { credentials: 'same-origin', method: 'GET' })
                        .finally(() => {
                            window.location.href = errorData.redirect || '/admin/login';
                        });
                    return;
                }
            } catch {
                // Se não conseguir parsear JSON, verificar se é redirect
                if (response.redirected || response.status === 302) {
                    window.location.href = '/admin/login';
                    return;
                }
                showToast('Erro ao carregar dados!', 'error');
            }
            return;
        }
        
        const users = await response.json();
        updateUsersTable(users);
        updateStats(users);
        showToast('Dados atualizados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        showToast('Erro ao atualizar dados!', 'error');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
        `;
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr data-user-id="${user.id}">
            <td>
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-cpf">${user.cpf}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="coupon-badge">${user.coupon}</span>
            </td>
            <td>
                <span class="sales-value">${formatCurrency(user.total_sales)}</span>
            </td>
            <td>
                <span class="lists-value">${user.total_lists}</span>
            </td>
            <td>
                <div class="progress-cell">
                    <div class="mini-progress">
                        <div class="mini-progress-bar" style="width: ${(user.total_sales / user.goal * 100).toFixed(1)}%"></div>
                    </div>
                    <span class="progress-text">${(user.total_sales / user.goal * 100).toFixed(1)}%</span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="openEditModal(${user.id})" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="action-btn delete" onclick="confirmDelete(${user.id}, '${user.name}')" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats(users) {
    const totalUsers = users.length;
    const totalSales = users.reduce((sum, u) => sum + u.total_sales, 0);
    const totalLists = users.reduce((sum, u) => sum + u.total_lists, 0);
    
    const statUsers = document.getElementById('statUsers');
    const statSales = document.getElementById('statSales');
    const statLists = document.getElementById('statLists');
    
    if (statUsers) statUsers.textContent = totalUsers;
    if (statSales) statSales.textContent = formatCurrency(totalSales);
    if (statLists) statLists.textContent = totalLists;
}

// ==================== CREATE MODAL ====================

function openCreateModal() {
    const modal = document.getElementById('createModal');
    const form = document.getElementById('createForm');
    if (form) {
        form.reset();
    }
    modal.classList.add('show');
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    modal.classList.remove('show');
    const form = document.getElementById('createForm');
    if (form) {
        form.reset();
    }
}

async function handleCreateSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('createName').value.trim();
    let cpf = document.getElementById('createCpf').value.trim();
    const password = document.getElementById('createPassword').value;
    
    if (!name || !cpf || !password) {
        showToast('Todos os campos são obrigatórios!', 'error');
        return;
    }
    
    // Remover formatação do CPF para validação
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
        showToast('CPF deve conter 11 dígitos!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]') || document.querySelector('#createForm button.btn-primary');
    if (!submitBtn) {
        showToast('Erro ao encontrar botão de envio!', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Criando...
    `;
    
    try {
        const response = await fetch('/admin/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                name: name,
                cpf: cpf,
                password: password
            })
        });
        
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            // Tentar parsear a mensagem de erro do servidor
            try {
                const errorData = await response.json();
                showToast(errorData.message || 'Erro ao criar usuário!', 'error');
                if (response.status === 401 || response.status === 403) {
                    fetch('/admin/logout', { credentials: 'same-origin', method: 'GET' })
                        .finally(() => {
                            window.location.href = '/admin/login';
                        });
                    return;
                }
            } catch (parseError) {
                if (response.redirected || response.status === 302) {
                    window.location.href = '/admin/login';
                    return;
                }
                showToast(`Erro ${response.status}: ${response.statusText}`, 'error');
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeCreateModal();
            refreshUsers();
        } else {
            showToast(data.message || 'Erro ao criar usuário!', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showToast('Erro ao conectar com o servidor!', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Criar Embaixador
        `;
    }
}

// Close create modal when clicking outside
document.addEventListener('click', (e) => {
    const createModal = document.getElementById('createModal');
    if (createModal && e.target === createModal) {
        closeCreateModal();
    }
});

// ==================== EDIT MODAL ====================

async function openEditModal(userId) {
    const modal = document.getElementById('editModal');
    
    try {
        const response = await fetch(`/admin/api/user/${userId}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                showToast(errorData.message || 'Erro ao carregar dados do usuário!', 'error');
                if (response.status === 401 || response.status === 403) {
                    fetch('/admin/logout', { credentials: 'same-origin', method: 'GET' })
                        .finally(() => {
                            window.location.href = '/admin/login';
                        });
                    return;
                }
            } catch {
                if (response.redirected || response.status === 302) {
                    window.location.href = '/admin/login';
                    return;
                }
                showToast('Erro ao carregar dados do usuário!', 'error');
            }
            return;
        }
        
        const user = await response.json();
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editAvatar').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('editName').textContent = user.name;
        document.getElementById('editCoupon').textContent = user.coupon;
        document.getElementById('editSales').value = formatCurrency(user.total_sales);
        document.getElementById('editLists').value = user.total_lists;
        document.getElementById('editGoal').value = formatCurrency(user.goal);
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showToast('Erro ao carregar dados do usuário!', 'error');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('show');
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const salesValue = parseCurrency(document.getElementById('editSales').value);
    const listsValue = parseInt(document.getElementById('editLists').value) || 0;
    const goalValue = parseCurrency(document.getElementById('editGoal').value);
    
    const submitBtn = e.target.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Salvando...
    `;
    
    try {
        const response = await fetch(`/admin/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                total_sales: salesValue,
                total_lists: listsValue,
                goal: goalValue
            })
        });
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                showToast(errorData.message || 'Erro ao atualizar usuário!', 'error');
                if (response.status === 401 || response.status === 403) {
                    fetch('/admin/logout', { credentials: 'same-origin', method: 'GET' })
                        .finally(() => {
                            window.location.href = '/admin/login';
                        });
                    return;
                }
            } catch {
                if (response.redirected || response.status === 302) {
                    window.location.href = '/admin/login';
                    return;
                }
                showToast('Erro ao atualizar usuário!', 'error');
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeEditModal();
            refreshUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Erro ao salvar alterações!', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Salvar Alterações
        `;
    }
}

// ==================== DELETE MODAL ====================

function confirmDelete(userId, userName) {
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('deleteUserName').textContent = userName;
    modal.classList.add('show');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
}

async function deleteUser() {
    const userId = document.getElementById('deleteUserId').value;
    const deleteBtn = document.querySelector('#deleteModal .btn-danger');
    
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `
        <svg class="spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Excluindo...
    `;
    
    try {
        const response = await fetch(`/admin/api/user/${userId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                showToast(errorData.message || 'Erro ao excluir usuário!', 'error');
                if (response.status === 401 || response.status === 403) {
                    fetch('/admin/logout', { credentials: 'same-origin', method: 'GET' })
                        .finally(() => {
                            window.location.href = '/admin/login';
                        });
                    return;
                }
            } catch {
                if (response.redirected || response.status === 302) {
                    window.location.href = '/admin/login';
                    return;
                }
                showToast('Erro ao excluir usuário!', 'error');
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closeDeleteModal();
            refreshUsers();
        } else {
            showToast(data.message || 'Erro ao excluir usuário!', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showToast('Erro ao excluir usuário!', 'error');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
        `;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseCurrency(value) {
    // Remove pontos de milhar e troca vírgula por ponto
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatCurrencyInput(e) {
    let value = e.target.value;
    // Remove tudo exceto números e vírgula
    value = value.replace(/[^\d,]/g, '');
    e.target.value = value;
}

function formatCurrencyBlur(e) {
    let value = parseCurrency(e.target.value);
    if (!isNaN(value)) {
        e.target.value = formatCurrency(value);
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const successIcon = toast.querySelector('.success-icon');
    const errorIcon = toast.querySelector('.error-icon');
    
    // Reset
    toast.classList.remove('success', 'error', 'show');
    if (successIcon) successIcon.classList.add('hidden');
    if (errorIcon) errorIcon.classList.add('hidden');
    
    // Set type
    toast.classList.add(type);
    toastMessage.textContent = message;
    
    if (type === 'success' && successIcon) {
        successIcon.classList.remove('hidden');
    } else if (type === 'error' && errorIcon) {
        errorIcon.classList.remove('hidden');
    }
    
    // Show
    toast.classList.add('show');
    
    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (e.target === editModal) {
        closeEditModal();
    }
    
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Add spin animation for loading buttons
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

