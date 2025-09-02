console.log('Script carregado');
console.log('API_URL:', API_URL);

const API_URL = 'https://script.google.com/macros/s/AKfycbxRW9icwOkeg5oTzy1MZWOha3QqfnAY9iQGUPNEulJ3naOJDqf13SZ9HNnORziLNJBN/exec';

// Variável global de autenticação
let isAuthenticated = false;
let currentUserEmail = '';

// Verificar autenticação
async function checkAuthentication() {
    try {
        console.log('Iniciando verificação de autenticação...');
        const payload = {
            action: "checkAuth"
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Status da resposta:', response.status);
        console.log('Headers:', response.headers);
        
        const data = await response.json();
        console.log('Dados da resposta:', data);
        
        if (data.authenticated) {
            isAuthenticated = true;
            currentUserEmail = data.email;
            console.log('Usuário autenticado:', data.email);
            return true;
        } else {
            console.log('Usuário não autenticado');
            showLoginPrompt(data.email);
            return false;
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        showLoginPrompt('Erro de conexão');
        return false;
    }
}

// Mostrar prompt de login
function showLoginPrompt(email) {
    const message = email ? 
        `Email não autorizado: ${email}\n\nPor favor, faça login com uma conta autorizada.` :
        'Por favor, faça login no Google para acessar suas finanças.';
    
    if (confirm(message + '\n\nClique em OK para fazer login.')) {
        // Redirecionar para login do Google
        window.location.href = 'https://accounts.google.com/AccountChooser?continue=' + 
                              encodeURIComponent(window.location.href);
    }
}

// Modificar a função loadSavedData
async function loadSavedData() {
    if (!isAuthenticated && !await checkAuthentication()) {
        return;
    }
    
    accounts = [];
    extraIncome = [];
    
    const payload = {
        action: "buscar",
        ano: parseInt(document.getElementById('year').value),
        mes: parseInt(document.getElementById('month').value)
    };
    
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (res.status === 401) {
            isAuthenticated = false;
            checkAuthentication();
            return;
        }
        
        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        accounts = data.accounts || [];
        extraIncome = data.extraIncome || [];
        document.getElementById('salary').value = data.salary || '';
        
        updateAccountsTable();
        updateIncomeTable();
        updateSummary();
        
    } catch (err) {
        console.error("Erro ao buscar:", err);
        alert("Erro ao carregar dados: " + err.message);
    }
}

// Modificar a função saveData
async function saveData() {
    if (!isAuthenticated && !await checkAuthentication()) {
        return;
    }
    
    const data = {
        accounts,
        extraIncome,
        salary: document.getElementById('salary').value
    };
    
    const payload = {
        action: "salvar",
        ano: parseInt(document.getElementById('year').value),
        mes: parseInt(document.getElementById('month').value),
        dados: data
    };
    
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (res.status === 401) {
            isAuthenticated = false;
            checkAuthentication();
            return;
        }
        
        const result = await res.json();
        console.log("Salvo no Google Sheets:", result);
        
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert("Erro ao salvar dados: " + err.message);
    }
}

// Modificar o evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Configurar event listeners primeiro
    document.getElementById('month').addEventListener('change', loadSavedData);
    document.getElementById('year').addEventListener('change', loadSavedData);
    
    // Verificar autenticação
    if (await checkAuthentication()) {
        // Só inicializar se estiver autenticado
        document.getElementById('addAccountBtn').addEventListener('click', addAccount);
        document.getElementById('addIncomeBtn').addEventListener('click', addIncome);
        document.getElementById('salary').addEventListener('change', updateSummary);
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        
        const now = new Date();
        document.getElementById('month').value = now.getMonth();
        document.getElementById('year').value = now.getFullYear();
        
        if (!document.getElementById('salary').value) {
            document.getElementById('salary').value = 3000;
        }
        
        loadSavedData();
    }
});