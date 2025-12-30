// Dados do usuário (carregados do Flask)
// userData é definido pelo Flask no HTML antes deste script ser carregado
// Exemplo: const userData = {{ user.to_dict()|tojson }};

// Calcular porcentagem total da meta
function calculateTotalProgress() {
    const totalSales = userData.totalSales;
    const goal = userData.goal;
    
    if (goal <= 0) return 0;
    
    const percentage = (totalSales / goal) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Garantir que está entre 0 e 100
}

// Atualizar progress stats
function updateProgressStats() {
    const totalPercentage = calculateTotalProgress();
    const progressPercentElement = document.getElementById('progressPercent');
    
    if (progressPercentElement) {
        progressPercentElement.textContent = totalPercentage.toFixed(1).replace('.', ',') + '%';
    }
}

// Inicializar dados
function initializeData() {
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('couponCode').textContent = userData.coupon;
    document.getElementById('salesValue').textContent = formatCurrency(userData.totalSales);
    document.getElementById('listsValue').textContent = userData.totalLists;
    
    // Calcular progresso baseado nos milestones para a barra
    const progress = calculateMilestoneProgress();
    const percentage = progress.percentage;
    
    // Atualizar barra de progresso
    document.getElementById('progressBar').style.width = percentage + '%';
    
    // Atualizar porcentagem total da meta
    updateProgressStats();
    
    const remaining = userData.goal - userData.totalSales;
    document.getElementById('remainingValue').textContent = 'R$ ' + formatCurrency(remaining);
    
    updateMilestones();
}

// Formatar moeda
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Atualizar milestones
function updateMilestones() {
    const milestones = [10000, 20000, 30000, 40000, 50000];
    const dots = document.querySelectorAll('.milestone-dot');
    const values = document.querySelectorAll('.milestone-value');
    
    milestones.forEach((milestone, index) => {
        if (userData.totalSales >= milestone) {
            dots[index].classList.add('active');
            values[index].classList.add('active');
        }
    });
}

// Calcular progresso baseado nos milestones
function calculateMilestoneProgress() {
    const milestones = [0, 10000, 20000, 30000, 40000, 50000];
    const totalSales = userData.totalSales;
    
    // Se já atingiu a meta final
    if (totalSales >= userData.goal) {
        return {
            percentage: 100,
            segmentPercentage: 100,
            currentMilestone: milestones[milestones.length - 1],
            nextMilestone: milestones[milestones.length - 1]
        };
    }
    
    // Encontrar em qual segmento (entre quais milestones) o usuário está
    let currentMilestoneIndex = 0;
    for (let i = milestones.length - 1; i >= 0; i--) {
        if (totalSales >= milestones[i]) {
            currentMilestoneIndex = i;
            break;
        }
    }
    
    const currentMilestone = milestones[currentMilestoneIndex];
    const nextMilestone = milestones[currentMilestoneIndex + 1] || userData.goal;
    
    // Calcular progresso percentual no segmento atual (0-100% entre os dois milestones)
    const segmentRange = nextMilestone - currentMilestone;
    const progressInSegment = totalSales - currentMilestone;
    const segmentPercentage = segmentRange > 0 ? (progressInSegment / segmentRange) * 100 : 0;
    
    // Calcular posição percentual na barra completa (0-100% da barra total)
    // Cada milestone representa 20% da barra (5 milestones = 0%, 20%, 40%, 60%, 80%, 100%)
    const milestonePercentage = (currentMilestoneIndex / (milestones.length - 1)) * 100;
    const segmentWidthPercentage = 100 / (milestones.length - 1);
    const percentage = milestonePercentage + (segmentPercentage * segmentWidthPercentage / 100);
    
    return {
        percentage: Math.min(percentage, 100),
        segmentPercentage: Math.min(segmentPercentage, 100),
        currentMilestone: currentMilestone,
        nextMilestone: nextMilestone
    };
}

// Copiar cupom
function copyCoupon() {
    const coupon = document.getElementById('couponCode').textContent;
    navigator.clipboard.writeText(coupon).then(() => {
        showToast();
    }).catch(err => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = coupon;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast();
    });
}

// Mostrar toast
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', initializeData);

// Animação do progress bar ao entrar na viewport
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progressBar = document.getElementById('progressBar');
            const progress = calculateMilestoneProgress();
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = progress.percentage + '%';
            }, 100);
        }
    });
}, { threshold: 0.5 });

observer.observe(document.querySelector('.progress-section'));

