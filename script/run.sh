echo "* - nofile 1048576" >> /etc/security/limits.conf

echo "fs.file-max = 1048576" >> /etc/sysctl.conf
echo "net.ipv4.ip_local_port_range = 1024 65535" >> /etc/sysctl.conf

echo "net.ipv4.tcp_mem = 786432 2097152 3145728" >> /etc/sysctl.conf
echo "net.ipv4.tcp_rmem = 4096 4096 16777216" >> /etc/sysctl.conf
echo "net.ipv4.tcp_wmem = 4096 4096 16777216" >> /etc/sysctl.conf

sysctl -p
