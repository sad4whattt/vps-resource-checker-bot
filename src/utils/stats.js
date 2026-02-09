import si from 'systeminformation';

export async function getSystemStats() {
    try {
        const [cpu, mem, fs, os, currentLoadData, processes, net, sys] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.osInfo(),
            si.currentLoad(),
            si.processes(),
            si.networkStats(),
            si.system()
        ]);

        const mainDisk = fs.find(d => d.mount === '/') || fs[0];
        const primaryNet = net.find(n => n.operstate === 'up') || net[0];

        return {
            hostname: os.hostname,
            platform: os.platform,
            distro: os.distro,
            release: os.release,
            codename: os.codename,
            arch: os.arch,
            kernel: os.kernel,
            manufacturer: sys.manufacturer,
            model: sys.model,
            cpuLoad: cpu.currentLoad.toFixed(2),
            cpuCores: cpu.cpus.length,
            loadAverages: currentLoadData.loadavg,
            processes: processes.all,
            procRunning: processes.running,
            netRx: (primaryNet.rx_sec / 1024).toFixed(2),
            netTx: (primaryNet.tx_sec / 1024).toFixed(2),
            memUsed: (mem.active / 1024 / 1024 / 1024).toFixed(2),
            memTotal: (mem.total / 1024 / 1024 / 1024).toFixed(2),
            memCached: (mem.cached / 1024 / 1024 / 1024).toFixed(2),
            memAvailable: (mem.available / 1024 / 1024 / 1024).toFixed(2),
            memPercent: ((mem.active / mem.total) * 100).toFixed(2),
            swapUsed: (mem.swapused / 1024 / 1024 / 1024).toFixed(2),
            swapTotal: (mem.swaptotal / 1024 / 1024 / 1024).toFixed(2),
            diskUsed: (mainDisk.used / 1024 / 1024 / 1024).toFixed(2),
            diskTotal: (mainDisk.size / 1024 / 1024 / 1024).toFixed(2),
            diskPercent: mainDisk.use.toFixed(2),
            uptime: formatUptime(si.time().uptime),
            serverTime: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
    } catch (error) {
        console.error('Error fetching system stats:', error);
        return null;
    }
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    let uptime = '';
    if (days > 0) uptime += `${days}d `;
    if (hours > 0) uptime += `${hours}h `;
    uptime += `${mins}m`;
    return uptime;
}
