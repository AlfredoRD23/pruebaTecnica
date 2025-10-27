CREATE DATABASE IF NOT EXISTS crm_banco;
USE crm_banco;


CREATE TABLE TipoProducto (
    IdTipoProducto INT AUTO_INCREMENT PRIMARY KEY,
    NombreTipo VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255)
);


CREATE TABLE Producto (
    IdProducto INT AUTO_INCREMENT PRIMARY KEY,
    NombreProducto VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255),
    IdTipoProducto INT,
    CONSTRAINT fk_producto_tipo FOREIGN KEY (IdTipoProducto) REFERENCES TipoProducto(IdTipoProducto)
);

CREATE TABLE Clientes (
    IdCliente INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Direccion VARCHAR(255),
    Telefono VARCHAR(20)
);


CREATE TABLE Ejecutivos (
    IdEjecutivo INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL
);


CREATE TABLE Visitas (
    IdVisita INT AUTO_INCREMENT PRIMARY KEY,
    IdCliente INT NOT NULL,
    IdEjecutivo INT NOT NULL,
    FechaVisita DATETIME NOT NULL,
    Resultado VARCHAR(100),
    CONSTRAINT fk_visita_cliente FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT fk_visita_ejecutivo FOREIGN KEY (IdEjecutivo) REFERENCES Ejecutivos(IdEjecutivo)
);


CREATE TABLE Ventas (
    IdVenta INT AUTO_INCREMENT PRIMARY KEY,
    IdCliente INT NOT NULL,
    IdProducto INT NOT NULL,
    FechaVenta DATETIME NOT NULL,
    Monto DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_venta_cliente FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT fk_venta_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto)
);
