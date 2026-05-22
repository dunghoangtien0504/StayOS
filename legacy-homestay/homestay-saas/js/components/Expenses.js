import { store } from '../store.js';

export const Expenses = {
    render() {
        const expenses = store.getExpenses();
        const configs = store.getConfigs();
        const properties = store.getProperties();

        return `
            <div class="topbar">
                <div class="topbar-title">QUẢN LÝ CHI PHÍ (EXPENSES)</div>
                <button class="btn btn-primary" id="btn-add-expense">+ Thêm chi phí</button>
            </div>
            
            <div class="view-container">
                <div class="data-card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Cơ sở</th>
                                <th>Danh mục</th>
                                <th>Số tiền</th>
                                <th>Mô tả</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(e => {
                                const prop = properties.find(p => p.id === e.property_id);
                                return `
                                    <tr>
                                        <td>${e.expense_date}</td>
                                        <td>${prop ? prop.name : 'Chung'}</td>
                                        <td><span class="badge badge-cleaning">${e.category}</span></td>
                                        <td class="text-danger">-${Number(e.amount).toLocaleString()}đ</td>
                                        <td>${e.description || ''}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Expense Modal -->
            <div class="modal-overlay" id="expense-modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Thêm chi phí mới</h2>
                    </div>
                    <form id="expense-form">
                        <div class="form-group">
                            <label>Cơ sở</label>
                            <select name="property_id" class="form-control">
                                <option value="">Chung - Toàn chuỗi</option>
                                ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Danh mục</label>
                            <select name="category" class="form-control" required>
                                ${configs.expense_categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Số tiền (đ)</label>
                            <input type="number" name="amount" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Ngày chi</label>
                            <input type="date" name="expense_date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>Ghi chú</label>
                            <textarea name="description" class="form-control"></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn" id="btn-close-expense">Hủy</button>
                            <button type="submit" class="btn btn-primary">Lưu chi phí</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    init() {
        const modal = document.getElementById('expense-modal');
        document.getElementById('btn-add-expense').onclick = () => modal.classList.add('active');
        document.getElementById('btn-close-expense').onclick = () => modal.classList.remove('active');

        document.getElementById('expense-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            store.addExpense(data);
            modal.classList.remove('active');
            window.app.navigate('expenses');
        };
    }
};
