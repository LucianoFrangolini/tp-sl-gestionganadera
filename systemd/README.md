## UBICACION DE LOS ARCHIVOS
```
/etc/systemd/system/backup-mongo.timer
/etc/systemd/system/backup-mongo.service
/usr/local/bin/backup-mongo.sh
/etc/backup-mongo/config.conf
```

## COMANDOS



#### Dar permisos de ejecucion
```
sudo chmod +x /usr/local/bin/backup-mongo.sh
```


#### Iniciar
```
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
```
```
sudo systemctl enable backup-mongo.timer
```
```
sudo systemctl start backup-mongo.timer
```

#### Ver los backups
```
cd /var/backups/mongodb //ver los backups
```

#### Reiniciar el servicio
```
sudo systemctl daemon-reload
sudo systemctl restart backup-mongo.timer
```


