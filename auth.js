document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        login(username, password);
    });

    document.getElementById('register').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        register(username, password, confirmPassword);
    });

    function login(username, password) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username] && users[username] === password) {
            localStorage.setItem('currentUser', username);
            alert('ورود موفقیت‌آمیز!');
            window.location.href = 'chart.html'; // هدایت به صفحه نمودار
        } else {
            alert('نام کاربری یا رمز عبور اشتباه است.');
        }
    }

    function register(username, password, confirmPassword) {
        if (password !== confirmPassword) {
            alert('رمز عبور و تکرار آن مطابقت ندارند.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) {
            alert('این نام کاربری قبلاً ثبت شده است.');
            return;
        }

        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        alert('ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید.');
        showLogin.click();
    }

    // بررسی وضعیت ورود در هنگام بارگذاری صفحه
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'chart.html'; // اگر کاربر قبلاً وارد شده است، به صفحه نمودار هدایت شود
    }
});