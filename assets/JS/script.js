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

// Remover elementos do prize-banner caso ainda existam (segurança)
function removePrizeBanner() {
    const prizeBanner = document.querySelector('.prize-banner');
    if (prizeBanner) {
        prizeBanner.remove();
    }
    const prizeIcon = document.querySelector('.prize-icon');
    if (prizeIcon) {
        prizeIcon.remove();
    }
    const prizeInfo = document.querySelector('.prize-info');
    if (prizeInfo) {
        prizeInfo.remove();
    }
    const prizeRemaining = document.querySelector('.prize-remaining');
    if (prizeRemaining) {
        prizeRemaining.remove();
    }
}

// Carregar ranking dos top 3 embaixadores
async function loadRanking() {
    console.log('🔍 Iniciando busca pelo elemento rankingList...');
    
    // Tentar encontrar o elemento com retry
    let rankingList = document.getElementById('rankingList');
    let attempts = 0;
    const maxAttempts = 20; // Aumentado para 20 tentativas (2 segundos)
    const retryDelay = 100; // 100ms entre tentativas
    
    // Aguardar o elemento estar disponível
    while (!rankingList && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        rankingList = document.getElementById('rankingList');
        attempts++;
        if (attempts % 5 === 0) {
            console.log(`⏳ Tentativa ${attempts}/${maxAttempts}...`);
        }
    }
    
    // Se ainda não encontrou, tentar por seletor também
    if (!rankingList) {
        console.log('🔍 Tentando buscar por classe .ranking-list...');
        rankingList = document.querySelector('.ranking-list');
    }
    
    // Se ainda não encontrou, verificar se a seção existe
    if (!rankingList) {
        let rankingSection = document.querySelector('.ranking-section');
        
        // Se a seção não existe, criar toda a seção de ranking
        if (!rankingSection) {
            console.log('⚠️ Seção de ranking não encontrada. Criando seção completa...');
            
            // Encontrar onde inserir (depois do progress-section ou antes do footer)
            const progressSection = document.querySelector('.progress-section');
            const footer = document.querySelector('.footer');
            const container = document.querySelector('.container');
            
            if (!container) {
                console.error('❌ Container não encontrado. Não é possível criar a seção de ranking.');
                return;
            }
            
            // Criar a seção completa de ranking
            rankingSection = document.createElement('section');
            rankingSection.className = 'ranking-section';
            rankingSection.innerHTML = `
                <div class="ranking-header">
                    <div class="ranking-title">
                        <div class="ranking-title-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <h2>Top 3 Embaixadores</h2>
                            <p>Os embaixadores com mais vendas</p>
                        </div>
                    </div>
                </div>
                <div class="ranking-list" id="rankingList">
                    <div class="ranking-loading">
                        <p>Carregando ranking...</p>
                    </div>
                </div>
            `;
            
            // Inserir a seção no local correto
            if (footer && footer.parentNode === container) {
                container.insertBefore(rankingSection, footer);
            } else if (progressSection && progressSection.nextSibling) {
                progressSection.parentNode.insertBefore(rankingSection, progressSection.nextSibling);
            } else if (progressSection) {
                progressSection.parentNode.appendChild(rankingSection);
            } else {
                container.appendChild(rankingSection);
            }
            
            console.log('✅ Seção de ranking criada e inserida no DOM!');
        }
        
        // Agora buscar o elemento rankingList dentro da seção (criada ou existente)
        rankingList = rankingSection.querySelector('#rankingList') || rankingSection.querySelector('.ranking-list');
        
        if (!rankingList) {
            console.log('⚠️ Criando elemento rankingList dentro da seção...');
            const newDiv = document.createElement('div');
            newDiv.className = 'ranking-list';
            newDiv.id = 'rankingList';
            rankingSection.appendChild(newDiv);
            rankingList = newDiv;
        }
        
        console.log('✅ Elemento rankingList encontrado/criado com sucesso!');
    }
    
    if (rankingList) {
        console.log('✅ Elemento rankingList encontrado/criado com sucesso!');
    }
    
    try {
        console.log('🌐 Fazendo requisição para /api/ranking/top3...');
        
        const response = await fetch('/api/ranking/top3', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Não autenticado. Redirecionando para login...');
                window.location.href = '/login';
                return;
            }
            
            // Tentar ler a mensagem de erro do servidor
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Se não conseguir ler JSON, usar mensagem padrão
            }
            
            console.error('❌ Erro na requisição:', errorMessage);
            
            // Se for 404, mostrar mensagem mais específica
            if (response.status === 404) {
                rankingList.innerHTML = `
                    <div class="ranking-empty">
                        <p>Erro: Rota não encontrada. Por favor, reinicie o servidor Flask para carregar a rota /api/ranking/top3</p>
                    </div>
                `;
                return;
            }
            
            throw new Error(errorMessage);
        }
        
        const ranking = await response.json();
        console.log('📋 Ranking recebido:', ranking);
        
        if (!Array.isArray(ranking)) {
            console.error('❌ Resposta não é um array:', ranking);
            throw new Error('Resposta inválida do servidor');
        }
        
        if (ranking.length === 0) {
            console.log('⚠️ Ranking vazio - nenhum embaixador encontrado');
            rankingList.innerHTML = `
                <div class="ranking-empty">
                    <p>Nenhum embaixador no ranking ainda.</p>
                </div>
            `;
            return;
        }
        
        // Definir classes de medalha
        const badgeClasses = ['gold', 'silver', 'bronze'];
        
        // Criar HTML do ranking
        let rankingHTML = '';
        ranking.forEach((user, index) => {
            const badgeClass = badgeClasses[index] || '';
            
            rankingHTML += `
                <div class="ranking-item">
                    <div class="ranking-position">
                        <div class="position-badge ${badgeClass}">${user.position}</div>
                    </div>
                    <div class="ranking-name">
                        <span>${user.name || 'Sem nome'}</span>
                    </div>
                </div>
            `;
        });
        
        rankingList.innerHTML = rankingHTML;
        console.log('✅ Ranking exibido com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar ranking:', error);
        console.error('📋 Detalhes do erro:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        if (rankingList) {
            let errorMessage = 'Erro ao carregar ranking. Tente novamente mais tarde.';
            
            // Mensagens mais específicas para diferentes tipos de erro
            if (error.message.includes('404') || error.message.includes('NOT FOUND')) {
                errorMessage = 'Erro: A rota /api/ranking/top3 não foi encontrada. Por favor, reinicie o servidor Flask.';
            } else if (error.message.includes('401') || error.message.includes('Não autenticado')) {
                errorMessage = 'Erro: Você precisa estar logado para ver o ranking.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
            }
            
            rankingList.innerHTML = `
                <div class="ranking-empty">
                    <p>${errorMessage}</p>
                </div>
            `;
        }
    }
}

// Inicializar quando a página carregar
function initializePage() {
    console.log('🚀 Inicializando página...');
    console.log('📊 Estado do DOM:', document.readyState);
    
    removePrizeBanner();
    initializeData();
    
    // Aguardar um pouco antes de carregar o ranking para garantir que o DOM está pronto
    // Aumentado para 500ms para dar mais tempo ao DOM renderizar completamente
    setTimeout(() => {
        console.log('⏰ Timeout executado, carregando ranking...');
        console.log('📋 Seção de ranking no DOM:', !!document.querySelector('.ranking-section'));
        console.log('📋 Elemento rankingList no DOM:', !!document.getElementById('rankingList'));
        loadRanking();
    }, 500);
}

// Verificar se o DOM já está carregado
if (document.readyState === 'loading') {
    console.log('⏳ DOM ainda carregando, aguardando DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ DOMContentLoaded disparado');
        initializePage();
    });
} else {
    // DOM já está carregado
    console.log('✅ DOM já carregado, inicializando imediatamente...');
    // Mesmo que esteja carregado, dar um pequeno delay para garantir renderização
    setTimeout(initializePage, 100);
}

// Fallback: também tentar quando a página estiver completamente carregada
window.addEventListener('load', function() {
    console.log('📄 Evento load disparado');
    // Verificar se o ranking foi carregado, se não, tentar novamente
    const rankingList = document.getElementById('rankingList');
    if (!rankingList || (rankingList.innerHTML.includes('Carregando') && !rankingList.querySelector('.ranking-item'))) {
        console.log('🔄 Tentando carregar ranking novamente após load...');
        setTimeout(() => {
            loadRanking();
        }, 300);
    }
});

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

