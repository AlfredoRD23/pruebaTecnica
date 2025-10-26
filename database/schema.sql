-- Esquema de Base de Datos Oracle para CRM Banco de Reservas
-- Parte 1: Análisis de Productividad por Ejecutivo

-- Tabla de Tipos de Productos
CREATE TABLE TipoProducto (
    IdTipoProducto NUMBER(10) PRIMARY KEY,
    NombreTipo VARCHAR2(100) NOT NULL,
    Descripcion VARCHAR2(255)
);

-- Tabla de Productos
CREATE TABLE Producto (
    IdProducto NUMBER(10) PRIMARY KEY,
    NombreProducto VARCHAR2(100) NOT NULL,
    Descripcion VARCHAR2(255),
    IdTipoProducto NUMBER(10),
    CONSTRAINT fk_producto_tipo FOREIGN KEY (IdTipoProducto) REFERENCES TipoProducto(IdTipoProducto)
);

-- Tabla de Clientes
CREATE TABLE Clientes (
    IdCliente NUMBER(10) PRIMARY KEY,
    Nombre VARCHAR2(100) NOT NULL,
    Apellido VARCHAR2(100) NOT NULL,
    Direccion VARCHAR2(255),
    Telefono VARCHAR2(20)
);

-- Tabla de Ejecutivos
CREATE TABLE Ejecutivos (
    IdEjecutivo NUMBER(10) PRIMARY KEY,
    Nombre VARCHAR2(100) NOT NULL,
    Apellido VARCHAR2(100) NOT NULL
);

-- Tabla de Visitas
CREATE TABLE Visitas (
    IdVisita NUMBER(10) PRIMARY KEY,
    IdCliente NUMBER(10) NOT NULL,
    IdEjecutivo NUMBER(10) NOT NULL,
    FechaVisita DATE NOT NULL,
    Resultado VARCHAR2(100),
    CONSTRAINT fk_visita_cliente FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT fk_visita_ejecutivo FOREIGN KEY (IdEjecutivo) REFERENCES Ejecutivos(IdEjecutivo)
);

-- Tabla de Ventas
CREATE TABLE Ventas (
    IdVenta NUMBER(10) PRIMARY KEY,
    IdCliente NUMBER(10) NOT NULL,
    IdProducto NUMBER(10) NOT NULL,
    FechaVenta DATE NOT NULL,
    Monto NUMBER(15,2) NOT NULL,
    CONSTRAINT fk_venta_cliente FOREIGN KEY (IdCliente) REFERENCES Clientes(IdCliente),
    CONSTRAINT fk_venta_producto FOREIGN KEY (IdProducto) REFERENCES Producto(IdProducto)
);

-- Secuencias para IDs autoincrementales
CREATE SEQUENCE seq_tipo_producto START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_producto START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_cliente START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_ejecutivo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_visita START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_venta START WITH 1 INCREMENT BY 1;
