// Login Form Handler
document.addEventListener('DOMContentLoaded', function() {
    // Toggle Password Visibility
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    });
    
    // Form Submit - Login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('.submit-btn');
        submitBtn.classList.add('loading');
        
        // Formatar CPF antes de enviar
        let cpf = document.getElementById('loginCpf').value;
        cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
        
        const formData = {
            cpf: cpf,
            password: document.getElementById('loginPassword').value
        };
        
        try {
            const response = await fetch('/login', {
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
                    window.location.href = data.redirect || '/dashboard';
                }, 1000);
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Erro ao conectar com o servidor!', 'error');
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
    
    // Máscara de CPF no input
    const cpfInput = document.getElementById('loginCpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            }
        });
    }
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const successIcon = toast.querySelector('.success-icon');
    const errorIcon = toast.querySelector('.error-icon');
    
    // Reset
    toast.classList.remove('success', 'error', 'show');
    successIcon.classList.add('hidden');
    errorIcon.classList.add('hidden');
    
    // Set type
    toast.classList.add(type);
    toastMessage.textContent = message;
    
    if (type === 'success') {
        successIcon.classList.remove('hidden');
    } else {
        errorIcon.classList.remove('hidden');
    }
    
    // Show
    toast.classList.add('show');
    
    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

