
use Usuarios
go
drop table usuarios

CREATE TABLE [dbo].[Usuarios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nombre] [nvarchar](255) NOT NULL,
	[Rut] [nvarchar](50) unique NOT NULL,
	[Correo] [nvarchar](255) NULL,
	[FechaNacimiento] [date] NOT NULL,
 CONSTRAINT [PK_Usuarios] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)) ON [PRIMARY] 