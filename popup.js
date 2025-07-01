document.addEventListener('DOMContentLoaded', () => {
    // 获取dom元素
    const urlInput = document.getElementById('url-input');
    const parseBtn = document.getElementById('parse-btn');
    const urlDetails = document.getElementById('url-details');
    const querySection = document.getElementById('query-section');
    const resultSection = document.getElementById('result-section');
    const emptyState = document.getElementById('empty-state');
    const paramsList = document.getElementById('params-list');
    const newKeyInput = document.getElementById('new-key');
    const newValueInput = document.getElementById('new-value');
    const addParamBtn = document.getElementById('add-param-btn');
    const resultUrl = document.getElementById('result-url');
    const copyBtn = document.getElementById('copy-btn');
    const notification = document.getElementById('notification');

    // 解析后的URL对象
    let parsedUrl = null;
    let queryParams = [];

    urlInput.value = '';

    // 解析URL
    parseBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();

        // 1. 检查是否为空
        if (!url) {
            showNotification('请输入URL', 'error');
            return;
        }

        try {
            // 如果URL解析失败的时候就会跑出异常，弹出通知框
            parsedUrl = new URL(url);

            // 显示解析结果 测试发现这里直接解析的协议会带 : 这里希望将这个后缀去掉
            let protocol = parsedUrl.protocol;
            if (protocol &&  protocol.endsWith(':')) {
                protocol = protocol.slice(0, -1);
            }
            document.getElementById('protocol').textContent = protocol;
            document.getElementById('hostname').textContent = parsedUrl.hostname;
            document.getElementById('pathname').textContent = parsedUrl.pathname;

            // 解析查询参数
            queryParams = [];
            // 通过URL的searchParams属性将url的所有参数获取到添加到数组中
            parsedUrl.searchParams.forEach((value, key) => {
                queryParams.push({ key, value });
            });

            renderParams();
            updateResultUrl();

            // 显示组件
            urlDetails.style.display = 'block';
            querySection.style.display = 'block';
            resultSection.style.display = 'block';
            emptyState.style.display = 'none';

        } catch (error) {
            showNotification('URL解析错误: ' + error.message, 'error');
            console.error('URL解析错误:', error);
        }
    });

    // 点击添加 添加参数按钮
    addParamBtn.addEventListener('click', () => {
        const key = newKeyInput.value.trim();
        const value = newValueInput.value.trim();

        // 如果参数的key为空，不允许添加，但是value允许为空。参考postman的规则
        if (!key) {
            showNotification('请输入参数名', 'error');
            return;
        }

        // 检查是否已存在相同参数名 —— 这里比较纠结，按理说如果是数组类型的参数，则确实会出现重名的key
        // if (queryParams.some(param => param.key === key)) {
        //     showNotification('参数名已存在', 'error');
        //     return;
        // }

        // 将添加的参数push进数组中
        queryParams.push({ key, value });
        renderParams();
        updateResultUrl();

        // 清空输入
        newKeyInput.value = '';
        newValueInput.value = '';
        newKeyInput.focus();
    });

    // 复制URL
    copyBtn.addEventListener('click', () => {
        resultUrl.select();
        document.execCommand('copy');

        // 显示通知
        showNotification('URL已复制到剪贴板');
    });

    // 渲染参数列表
    function renderParams() {
        paramsList.innerHTML = '';

        if (queryParams.length === 0) {
            paramsList.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #868e96;">无查询参数</td></tr>`;
            return;
        }

        queryParams.forEach((param, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                        <td><input type="text" class="param-key" value="${param.key}" data-index="${index}"></td>
                        <td><input type="text" class="param-value" value="${param.value}" data-index="${index}"></td>
                        <td><button class="delete-btn" data-index="${index}">🗑️ 删除</button></td>
                    `;
            paramsList.appendChild(row);
        });

        // 添加事件监听器,用户有可能添加了之后会修改参数的key
        document.querySelectorAll('.param-key').forEach(input => {
            input.addEventListener('input', handleParamChange);
        });

        // 添加value输入框的监听器，用户有可能会修改参数的value
        document.querySelectorAll('.param-value').forEach(input => {
            input.addEventListener('input', handleParamChange);
        });

        // 添加删除按钮的监听器，如果点击将参数从参数数组中移除
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteParam);
        });
    }

    // 处理参数变化
    function handleParamChange(e) {
        const index = parseInt(e.target.dataset.index);
        const isKey = e.target.classList.contains('param-key');

        if (isKey) {
            queryParams[index].key = e.target.value;
        } else {
            queryParams[index].value = e.target.value;
        }

        updateResultUrl();
    }

    // 删除参数
    function handleDeleteParam(e) {
        const index = parseInt(e.target.dataset.index);
        queryParams.splice(index, 1);
        renderParams();
        updateResultUrl();
    }

    // 更新结果URL
    function updateResultUrl() {
        if (!parsedUrl) return;

        // 创建新的URL对象
        const newUrl = new URL(parsedUrl.origin + parsedUrl.pathname);

        // 添加查询参数
        queryParams.forEach(param => {
            if (param.key) {
                newUrl.searchParams.append(param.key, param.value);
            }
        });

        resultUrl.value = newUrl.href;
    }

    // 显示通知
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.style.background = type === 'error' ? '#ff6b6b' : '#40c057';
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 按Enter键触发解析
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            parseBtn.click();
        }
    });
});