const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configurar la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: "34.67.253.112",
  port: "3306",
  user: "raul",
  password: "admin123",
  database: "depa_w",
});

// Conectar a la base de datos MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conexión a la base de datos establecida");
});

//------------------------------------------------------------------------------------------------------------------//
// Ruta para buscar empleados por criterios de búsqueda
app.get("/buscarEmpleados", (req, res) => {
  const { criterios } = req.query;

  // Crear la consulta SQL dinámica
  let query = "SELECT * FROM Empleado";
  let params = [];

  // Verificar si se proporcionaron criterios de búsqueda
  if (criterios) {
    const { rut, nombre, apellido } = JSON.parse(criterios);

    // Agregar cláusula WHERE a la consulta SQL basada en los criterios proporcionados
    let whereClause = "";

    if (rut) {
      whereClause += " rut = ? AND";
      params.push(rut);
    }

    if (nombre) {
      whereClause += " primer_nombre LIKE ? AND";
      params.push(`%${nombre}%`);
    }

    if (apellido) {
      whereClause += " primer_apellido LIKE ? AND";
      params.push(`%${apellido}%`);
    }

    // Eliminar el último "AND" de la cláusula WHERE
    if (whereClause.length > 0) {
      whereClause = whereClause.slice(0, -4);
      query += ` WHERE${whereClause}`;
    }
  }

  // Ejecutar la consulta
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("Error al buscar empleados:", err);
      res.status(500).json({ error: "Error al buscar empleados" });
      return;
    }

    res.json(results);
  });
});

// Ruta para agregar un empleado
app.post("/agregarEmpleado", (req, res) => {
  const {
    rut,
    dv,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    direccion,
    mail,
    estatus,
    id_cargo,
    id_conjunto,
    id_comuna,
    id_region,
  } = req.body;

  // Generar el usuario y la clave basados en el primer_nombre y primer_apellido
  const usuario = generarUsuario(primer_nombre, primer_apellido);
  const clave = usuario;

  // Crear el objeto con los datos del empleado
  const empleadoData = {
    rut,
    dv,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    direccion,
    mail,
    estatus,
    id_cargo,
    usuario,
    id_conjunto,
    id_comuna,
    id_region,
    clave,
  };

  // Consultar si el empleado ya existe antes de insertarlo
  const selectQuery = "SELECT * FROM Empleado WHERE rut = ?";
  connection.query(selectQuery, [rut], (error, results) => {
    if (error) {
      console.error("Error al consultar el empleado:", error);
      res.status(500).json({ error: "Error al consultar el empleado" });
      return;
    }

    if (results.length > 0) {
      res.status(409).json({ error: "El empleado ya existe" });
      return;
    }

    // Insertar el empleado en la base de datos
    const insertQuery = "INSERT INTO Empleado SET ?";
    connection.query(insertQuery, empleadoData, (error) => {
      if (error) {
        console.error("Error al insertar el empleado:", error);
        res.status(500).json({ error: "Error al insertar el empleado" });
        return;
      }

      res.json({ message: "Empleado insertado correctamente" });
    });
  });
});

// Función para generar el usuario basado en el primer_nombre y primer_apellido
function generarUsuario(primer_nombre, primer_apellido) {
  const nombreUsuario = primer_nombre.charAt(0) + primer_apellido;
  const numeroAleatorio = Math.floor(Math.random() * 100);
  return `${nombreUsuario}${numeroAleatorio}`;
}
app.put("/actualizarEmpleado/:rut", (req, res) => {
  const rutEmpleado = req.params.rut;
  const {
    dv,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    direccion,
    mail,
    estatus,
    id_cargo,
    id_conjunto,
    id_comuna,
    id_region,
  } = req.body;

  // Generar el usuario y la clave basados en el primer_nombre y primer_apellido
  const usuario = generarUsuario(primer_nombre, primer_apellido);
  const clave = usuario;

  // Crear el objeto con los datos actualizados del empleado
  const empleadoData = {
    dv,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    direccion,
    mail,
    estatus,
    id_cargo,
    usuario,
    id_conjunto,
    id_comuna,
    id_region,
    clave,
  };

  // Actualizar el empleado en la base de datos
  const updateQuery = "UPDATE Empleado SET ? WHERE rut = ?";
  connection.query(
    updateQuery,
    [empleadoData, rutEmpleado],
    (error, results) => {
      if (error) {
        console.error("Error al actualizar el empleado:", error);
        res.status(500).json({ error: "Error al actualizar el empleado" });
        return;
      }

      if (results.affectedRows === 0) {
        res.status(404).json({ error: "Empleado no encontrado" });
        return;
      }

      res.json({ message: "Empleado actualizado correctamente" });
    }
  );
});

app.get("/buscarEmpleadoPorRut/:rut", (req, res) => {
  const rut = req.params.rut;

  // Consultar el empleado por rut
  const selectQuery = "SELECT * FROM Empleado WHERE rut = ?";
  connection.query(selectQuery, [rut], (error, results) => {
    if (error) {
      console.error("Error al buscar el empleado:", error);
      res.status(500).json({ error: "Error al buscar el empleado" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "Empleado no encontrado" });
      return;
    }

    const empleado = results[0];
    res.json(empleado);
  });
});

app.delete("/eliminarEmpleado/:rut", (req, res) => {
  const rut = req.params.rut;

  // Eliminar el empleado por rut
  const deleteQuery = "DELETE FROM Empleado WHERE rut = ?";
  connection.query(deleteQuery, [rut], (error, results) => {
    if (error) {
      console.error("Error al eliminar el empleado:", error);
      res.status(500).json({ error: "Error al eliminar el empleado" });
      return;
    }

    if (results.affectedRows === 0) {
      res.status(404).json({ error: "Empleado no encontrado" });
      return;
    }

    res.json({ message: "Empleado eliminado correctamente" });
  });
});

// Traer los empleados de cargo Guardias
app.get("/empleadosGuardias", (req, res) => {
  // Consulta SQL modificada con cláusula WHERE
  const query = `
    SELECT
      e.rut,
      e.dv,
      e.primer_nombre,
      e.segundo_nombre,
      e.primer_apellido,
      e.segundo_apellido,
      e.direccion,
      e.mail,
      e.estatus,
      c.cargo,
      co.nombre_comuna,
      r.nombre_region
    FROM
      Empleado e
      JOIN Cargo c ON e.id_cargo = c.id_cargo
      JOIN Comuna co ON e.id_comuna = co.id_comuna
      JOIN Region r ON co.id_region = r.id_region
    WHERE
      c.cargo = 'Guardia';
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los datos de los empleados:", error);
      res.status(500).send("Error al obtener los datos de los empleados");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});

// Traer los empleados de cargo Jardinero
app.get("/empleadosJardinero", (req, res) => {
  // Consulta SQL modificada con cláusula WHERE
  const query = `
    SELECT
      e.rut,
      e.dv,
      e.primer_nombre,
      e.segundo_nombre,
      e.primer_apellido,
      e.segundo_apellido,
      e.direccion,
      e.mail,
      e.estatus,
      c.cargo,
      co.nombre_comuna,
      r.nombre_region
    FROM
      Empleado e
      JOIN Cargo c ON e.id_cargo = c.id_cargo
      JOIN Comuna co ON e.id_comuna = co.id_comuna
      JOIN Region r ON co.id_region = r.id_region
    WHERE
      c.cargo = 'Jardinero';
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los datos de los empleados:", error);
      res.status(500).send("Error al obtener los datos de los empleados");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});

// Traer los empleados de cargo Aseo
app.get("/empleadosAseo", (req, res) => {
  // Consulta SQL modificada con cláusula WHERE
  const query = `
    SELECT
      e.rut,
      e.dv,
      e.primer_nombre,
      e.segundo_nombre,
      e.primer_apellido,
      e.segundo_apellido,
      e.direccion,
      e.mail,
      e.estatus,
      c.cargo,
      co.nombre_comuna,
      r.nombre_region
    FROM
      Empleado e
      JOIN Cargo c ON e.id_cargo = c.id_cargo
      JOIN Comuna co ON e.id_comuna = co.id_comuna
      JOIN Region r ON co.id_region = r.id_region
    WHERE
      c.cargo = 'Aseo';
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los datos de los empleados:", error);
      res.status(500).send("Error al obtener los datos de los empleados");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});

// Traer los empleados de cargo Administrador
app.get("/empleadosAdmin", (req, res) => {
  // Consulta SQL modificada con cláusula WHERE
  const query = `
    SELECT
      e.rut,
      e.dv,
      e.primer_nombre,
      e.segundo_nombre,
      e.primer_apellido,
      e.segundo_apellido,
      e.direccion,
      e.mail,
      e.estatus,
      c.cargo,
      co.nombre_comuna,
      r.nombre_region
    FROM
      Empleado e
      JOIN Cargo c ON e.id_cargo = c.id_cargo
      JOIN Comuna co ON e.id_comuna = co.id_comuna
      JOIN Region r ON co.id_region = r.id_region
    WHERE
      c.cargo = 'Administrador';
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los datos de los empleados:", error);
      res.status(500).send("Error al obtener los datos de los empleados");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});
// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log("API escuchando en el puerto 3000");
});

// Ruta para buscar comunas
app.get("/buscarComunas", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Comuna";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar comunas:", err);
      res.status(500).json({ error: "Error al buscar comunas" });
      return;
    }

    res.json(results);
  });
});

// Ruta para buscar comunas por Region
app.get("/buscarComunasPorRegion/:id_region", (req, res) => {
  const idRegion = req.params.id_region;

  // Consulta SQL con parámetro de búsqueda
  const query = "SELECT * FROM Comuna WHERE id_region = ?";

  // Ejecutar la consulta con el parámetro
  connection.query(query, [idRegion], (err, results) => {
    if (err) {
      console.error("Error al buscar comunas por región:", err);
      res.status(500).json({ error: "Error al buscar comunas por región" });
      return;
    }

    res.json(results);
  });
});

// Ruta para buscar Regiones
app.get("/buscarRegiones", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Region";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar comunas:", err);
      res.status(500).json({ error: "Error al buscar comunas" });
      return;
    }

    res.json(results);
  });
});

// Ruta para buscar Regiones
app.get("/buscarCargos", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Cargo";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar comunas:", err);
      res.status(500).json({ error: "Error al buscar comunas" });
      return;
    }

    res.json(results);
  });
});
