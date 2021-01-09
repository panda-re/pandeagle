async function loadThreadList() {
    const data = await d3.json('http://localhost:3000/executions/1/threadslices')
    const threads = [...new Set(data.map(d => d.names[0]))].map(d => ({ name: d, visible: true }))

    const searchBox = document.querySelector('.search-box')
    searchBox.addEventListener('change', event => threads.filter(({ name }) => name.toLowerCase().includes(event.target.value.toLowerCase())))

    updateThreadList(threads)

    const sidebarToggleButton = document.querySelector('#sidebar-collapse')
    const sidebar = document.querySelector('.sidebar')
    sidebarToggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('active')
    })
}

function updateThreadList(threads) {
    const threadList = document.querySelector('.thread-list')
    threadList.innerHTML = ''
    threads.forEach(thread => {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = thread.visible

        const span = document.createElement('span')
        span.textContent = thread.name

        const li = document.createElement('li')
        li.className = 'list-group-item list-group-item-action d-flex w-100 justify-content-between'
        li.__data__ = thread
        li.appendChild(span)
        li.appendChild(checkbox)

        threadList.appendChild(li)
    })

    const lis = threadList.querySelectorAll('li')
    let lastChecked
    lis.forEach(li => li.addEventListener('click', event => {
        const currentCheckbox = li.querySelector('input[type="checkbox"]')
        if (event.target !== currentCheckbox) {
            currentCheckbox.checked = li.__data__.visible = !currentCheckbox.checked
        }

        let inBetween = false
        if (event.shiftKey) {
            lis.forEach(li => {
                const checkbox = li.querySelector('input[type="checkbox"]')
                if (checkbox === currentCheckbox || checkbox === lastChecked) {
                    inBetween = !inBetween
                }
                if (inBetween) {
                    checkbox.checked = li.__data__.visible = lastChecked.checked
                }
            })
        }

        lastChecked = currentCheckbox
    }))


}