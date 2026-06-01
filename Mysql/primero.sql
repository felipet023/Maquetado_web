create database tiendita;
use tiendita;
create table producto (
id_producto int primary key auto_increment,
nombre_producto varchar (50),
descripcion_producto varchar(200),
precio_venta decimal(18),
activo_producto boolean

);
use tiendita;
select * from producto; -- read (leer)

insert into producto (nombre_producto,descripcion_producto,precio_venta,activo_producto)
values ("colgate","crema dental blanqueadora",4500,1); 

insert into producto (nombre_producto,descripcion_producto, precio_venta,activo_producto)
values ("doritos","mecato",5000, 1),
("smirnoff","licor",55000, 1),
("cilantro","hierbas",2500, 1),
("cimarron","hierba",2000, 1),
("ducales","galletas",13000, 1),
("poker","licor",2000, 1),
("h2o","bebida",2500, 1),
("chorizo","carne",5000, 1),
("cuca","galleta",2000, 1),
("aceite johnson","aceite para bebes",9000, 1);

update producto
set nombre_producto = "saltin" 
where id_producto = 13;

delete from producto 
where id_producto in (34, 33, 32, 31, 30, 28, 27 ,29 );


 create table provedores (
 id_provedores int primary key auto_increment,
 nombre_provedor varchar (60),
 apellido_provedor varchar(60),
 telefono  varchar(20),
 empresa varchar (100)
 );
 use tiendita;
select * from provedores;

insert into provedores (  
nombre_provedor,apellido_provedor,telefono,empresa) 
values 
("juan","ramirez","32565478","colanta"),
("camilo","ocoro","325659054","cremelado"),
("camila","narvaes","32565431","yupi"),
("tatian","arcia","65388234","coca cola"),
("denis","murrillo","543662212","yumbo");

update provedores 
set telefono = 300675978
where id_provedores = 2;






