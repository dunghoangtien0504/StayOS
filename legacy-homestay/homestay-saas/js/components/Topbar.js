export const Topbar = {
    render() {
        return `
            <div class="topbar">
                <div class="topbar-title" id="page-title">Dashboard</div>
                <div class="user-profile">
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Cập nhật dữ liệu
                    </button>
                    <div class="avatar">A</div>
                </div>
            </div>
        `;
    },

    setTitle(title) {
        const el = document.getElementById('page-title');
        if (el) el.textContent = title;
    }
};
