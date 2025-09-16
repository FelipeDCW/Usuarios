
Create database UsuariosDB

use UsuariosDB
go
drop table usuarios

CREATE TABLE [dbo].[Usuarios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](50) NOT NULL,
	[Rut] [nvarchar](50) unique NOT NULL,
	[Correo] [nvarchar](200) NULL,
	[FechaNacimiento] [date] NOT NULL,
 CONSTRAINT [PK_Usuarios] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)) ON [PRIMARY] 