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
//------------------------------------------------------------------------------------------------------//
//---------------------------------------AUTENTICACION DEL LOGIN----------------------------------------//
//------------------------------------------------------------------------------------------------------//
//Autencicacion
app.post("/authenticate", (req, res) => {
  const { usuario, clave } = req.body;

  // Verificar si el usuario existe y las credenciales son correctas
  const query = `
    SELECT * FROM Empleado WHERE usuario = ? AND clave = ? AND id_cargo = 4
  `;
  const values = [usuario, clave];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error de servidor" });
    }

    if (results.length > 0) {
      // Autenticación exitosa
      return res.json({ authenticated: true });
    } else {
      // Credenciales incorrectas o usuario no encontrado
      return res.json({ authenticated: false });
    }
  });
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

      res.json({
        message: "Empleado insertado correctamente",
        usuario: usuario,
        clave: clave,
      });
    });
  });
});

// Función para generar el usuario basado en el primer_nombre y primer_apellido
function generarUsuario(primer_nombre, primer_apellido) {
  const nombreUsuario = primer_nombre.charAt(0) + primer_apellido;
  const numeroAleatorio = Math.floor(Math.random() * 100);
  return `${nombreUsuario}${numeroAleatorio}`;
}
//Metodo para actualizar el empleado.
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

    // Consultar la comuna del empleado
    const selectComunaQuery = "SELECT * FROM Comuna WHERE id_comuna = ?";
    connection.query(
      selectComunaQuery,
      [empleado.id_comuna],
      (comunaError, comunaResults) => {
        if (comunaError) {
          console.error("Error al buscar la comuna del empleado:", comunaError);
          res
            .status(500)
            .json({ error: "Error al buscar la comuna del empleado" });
          return;
        }

        if (comunaResults.length === 0) {
          res.status(404).json({ error: "Comuna del empleado no encontrada" });
          return;
        }

        const comunaId = comunaResults[0].id_comuna;
        empleado.id_comuna = comunaId;

        res.json(empleado);
      }
    );
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

// Traer los empleados de todos los cargos
app.get("/empleados", (req, res) => {
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
ORDER BY
  e.primer_apellido ASC;

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

// Ruta para buscar regiones por comuna
app.get("/buscarRegionPorComuna/:id_comuna", (req, res) => {
  const idComuna = req.params.id_comuna;

  // Consulta SQL con parámetro de búsqueda
  const query = "SELECT * FROM Region WHERE id_comuna = ?";

  // Ejecutar la consulta con el parámetro
  connection.query(query, [idComuna], (err, results) => {
    if (err) {
      console.error("Error al buscar Region por comuna:", err);
      res.status(500).json({ error: "Error al buscar Region por comuna" });
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

// Ruta para buscar Cargos
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

// Ruta para buscar CONDOMINIOS
app.get("/buscarCondominio", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Conjunto_residencial";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar condominios:", err);
      res.status(500).json({ error: "Error al buscar condominios" });
      return;
    }

    res.json(results);
  });
});
// Ruta para buscar EDIFICIO
app.get("/buscarEdificio", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Edificio";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar edificios:", err);
      res.status(500).json({ error: "Error al buscar edificios" });
      return;
    }

    res.json(results);
  });
});
// Ruta para buscar DEPARTAMENTO
app.get("/buscarDepartamento", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Departamento";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar departamentos:", err);
      res.status(500).json({ error: "Error al buscar departamentos" });
      return;
    }

    res.json(results);
  });
});

//-------------------------------------------------------------------------------------------------//
//                RESIDENTES                            //
//-------------------------------------------------------------------------------------------------//

//LLAMAR RESIDENTES
app.get("/residentes", (req, res) => {
  const query = `
  SELECT
  p.rut,
  p.dv,
  p.primer_nombre,
  p.segundo_nombre,
  p.primer_apellido,
  p.segundo_apellido,
  p.direccion,
  p.mail,
  p.estado,
  tp.tip_per,
  cr.nombre_conjunto,
  p.id_departamento,
  p.id_edificio,
  cr.direccion AS conjunto_direccion,
  co.nombre_comuna,
  r.nombre_region
FROM
  Persona p
  JOIN Tipo_persona tp ON p.id_tipo_persona = tp.id_tipoper
  JOIN Departamento d ON p.id_departamento = d.id_departamento
  JOIN Edificio e ON d.id_edificio = e.id_edificio
  JOIN Conjunto_residencial cr ON e.id_conjunto = cr.id_conjunto
  JOIN Comuna co ON cr.id_comuna = co.id_comuna
  JOIN Region r ON cr.id_region = r.id_region
WHERE
  p.id_tipo_persona IN (1, 3)
ORDER BY
  p.primer_apellido ASC;
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al obtener los datos de los residentes:", error);
      res.status(500).send("Error al obtener los datos de los residentes");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});

//Entrega los vehiculos de los residentes.
app.get("/residentevehiculos", (req, res) => {
  const query = `
  SELECT
    v.patente,
    tv.tipo_veh,
    cv.color_veh,
    p.rut,
    p.dv,
    p.primer_nombre,
    p.primer_apellido,
    p.id_departamento,
    p.id_edificio,
    e.id_est,
    cr.nombre_conjunto
FROM
    Persona p
    JOIN Departamento d ON p.id_departamento = d.id_departamento
    JOIN Edificio ed ON d.id_edificio = ed.id_edificio
    JOIN Conjunto_residencial cr ON ed.id_conjunto = cr.id_conjunto
    JOIN Persona_Vehiculo pv ON p.rut = pv.rut
    JOIN Vehiculo v ON pv.patente = v.patente
    JOIN Tipo_vehiculo tv ON v.id_tipoveh = tv.id_tipoveh
    JOIN Color_vehiculo cv ON v.id_color = cv.id_colorveh
    JOIN Estacionamiento e ON pv.id_est = e.id_est
ORDER BY
    p.primer_apellido ASC;
  `;

  // Ejecutar la consulta
  connection.query(query, (error, results) => {
    if (error) {
      console.error(
        "Error al obtener los datos de los residentes y vehículos:",
        error
      );
      res
        .status(500)
        .send("Error al obtener los datos de los residentes y vehículos");
    } else {
      // Enviar los resultados como respuesta
      res.json(results);
    }
  });
});

app.post("/agregarResidente", (req, res) => {
  const {
    rut,
    dv,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    direccion,
    mail,
    estado,
    tip_per,
    id_departamento,
    id_edificio,
    id_conjunto,
  } = req.body;

  // Consultar la dirección del conjunto residencial
  const selectQuery =
    "SELECT direccion FROM Conjunto_residencial WHERE id_conjunto = ?";
  connection.query(selectQuery, [id_conjunto], (error, results) => {
    if (error) {
      console.error(
        "Error al consultar la dirección del conjunto residencial:",
        error
      );
      res.status(500).json({
        error: "Error al consultar la dirección del conjunto residencial",
      });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "No se encontró el conjunto residencial" });
      return;
    }

    const conjuntoDireccion = results[0].direccion;

    // Crear el objeto con los datos del residente
    const residenteData = {
      rut,
      dv,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      direccion: conjuntoDireccion, // Establecer la dirección del conjunto residencial
      mail,
      estado,
      id_tipo_persona: obtenerIdTipoPersona(tip_per),
      id_departamento,
      id_edificio,
      id_conjunto,
    };

    // Consultar si el residente ya existe antes de insertarlo
    const selectQuery = "SELECT * FROM Persona WHERE rut = ?";
    connection.query(selectQuery, [rut], (error, results) => {
      if (error) {
        console.error("Error al consultar el residente:", error);
        res.status(500).json({ error: "Error al consultar el residente" });
        return;
      }

      if (results.length > 0) {
        res.status(409).json({ error: "El residente ya existe" });
        return;
      }

      // Insertar el residente en la base de datos
      const insertQuery = "INSERT INTO Persona SET ?";
      connection.query(insertQuery, residenteData, (error) => {
        if (error) {
          console.error("Error al insertar el residente:", error);
          res.status(500).json({ error: "Error al insertar el residente" });
          return;
        }

        res.json({
          message: "Residente insertado correctamente",
        });
      });
    });
  });
});

// Función auxiliar para obtener el id_tipo_persona basado en el tip_per
function obtenerIdTipoPersona(tip_per) {
  switch (tip_per) {
    case "propietario":
      return 1;
    case "visita":
      return 2;
    case "arrendatario":
      return 3;
    default:
      return null;
  }
}

app.get("/ObtenerPaqueterias", (req, res) => {
  const query = `
  SELECT p.*, cr.nombre_conjunto, e.usuario
  FROM Pedido AS p
  JOIN Conjunto_residencial AS cr ON p.id_conjunto = cr.id_conjunto
  JOIN Empleado AS e ON p.rut_empleado = e.rut  
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al realizar la consulta:", err);
      res
        .status(500)
        .json({ error: "Error al obtener los datos de los pedidos" });
      return;
    }
    res.json(results);
  });
});

//--------------------------------------------------------------------------------------------//
//-------------------------- INGRESOS > VEHICULOS --------------------------------------------//
//--------------------------------------------------------------------------------------------//

// Ruta para obtener vehiculos de visitas
app.get("/vehVisitas", (req, res) => {
  // Consulta SQL
  const query = `
  SELECT v.patente, v.nombre, v.apellido, v.id_departamento, v.id_est, v.id_edificio, v.fecha_ing, v.fecha_sal, m.estatus, id_visita
  FROM Visita v
  LEFT JOIN Multa m ON v.id_departamento = m.id_departamento AND v.id_edificio = m.id_edificio AND v.id_conjunto = m.id_conjunto
  WHERE v.rut_visita IS NOT NULL AND v.patente IS NOT NULL;
  `;
  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar vehiculos de visitas:", err);
      res.status(500).json({ error: "Error al buscar vehiculos de visitas" });
      return;
    }

    res.json(results);
  });
});

//--------------------------------------------------------------------------------------------//
//-------------------------- INGRESOS > VISITAS --------------------------------------------//
//--------------------------------------------------------------------------------------------//
// Ruta para mostrar visitas
app.get("/visitas", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Visita";

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

//--------------------------------------------------------------------------------------------//
//-------------------------- ADMINISTRACION > VEHICULOS --------------------------------------//
//--------------------------------------------------------------------------------------------//

// METODO PARA BUSCAR PATENTE:
app.get("/verificarPatente/:patente", (req, res) => {
  // Obtener la patente de los parámetros de la URL
  const patente = req.params.patente;

  // Consulta SQL para verificar si la patente existe en la tabla Vehiculo
  const query = "SELECT COUNT(*) AS count FROM Vehiculo WHERE patente = ?";

  // Ejecutar la consulta con la patente como parámetro
  connection.query(query, [patente], (err, results) => {
    if (err) {
      console.error("Error al verificar la patente:", err);
      res.status(500).json({ error: "Error al verificar la patente" });
      return;
    }

    // Obtener el resultado de la consulta
    const count = results[0].count;

    // Comprobar si la patente existe en la base de datos
    const existe = count > 0;

    // Devolver la respuesta como JSON
    res.json({ existe });
  });
});

app.get("/buscarVehiculo", (req, res) => {
  const { patente } = req.query;

  const query = `
  SELECT v.patente, v.id_tipoveh, tv.tipo_veh, v.id_color, v.estado,
    p.primer_nombre, p.primer_apellido, p.id_departamento, p.id_edificio, p.id_conjunto,pv.id_est
  FROM Vehiculo v
  INNER JOIN Tipo_vehiculo tv ON v.id_tipoveh = tv.id_tipoveh
  INNER JOIN Color_vehiculo cv ON v.id_color = cv.id_colorveh
  INNER JOIN Persona_Vehiculo pv ON v.patente = pv.patente
  INNER JOIN Persona p ON pv.rut = p.rut
  WHERE v.patente = ?`;

  connection.query(query, [patente], (err, results) => {
    if (err) {
      console.error("Error al realizar la consulta:", err);
      res.status(500).json({ error: "Error al buscar el vehículo" });
      return;
    }

    if (results.length === 0) {
      res
        .status(404)
        .json({ mensaje: "Vehículo no encontrado en el condominio" });
    } else {
      const vehiculo = {
        patente: results[0].patente,
        id_tipoveh: results[0].id_tipoveh,
        tipo_veh: results[0].tipo_veh,
        id_color: results[0].id_color,
        estado: results[0].estado,
        primer_nombre: results[0].primer_nombre,
        primer_apellido: results[0].primer_apellido,
        id_departamento: results[0].id_departamento,
        id_edificio: results[0].id_edificio,
        id_conjunto: results[0].id_conjunto,
        id_est: results[0].id_est,
      };
      res.json(vehiculo);
    }
  });
});

// Ruta para mostrar Colores de vehiculos
app.get("/obtenerColorVeh", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Color_vehiculo";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar colores de vehiculo:", err);
      res.status(500).json({ error: "Error al buscar colores de vehiculo" });
      return;
    }

    res.json(results);
  });
});

// Ruta para mostrar estados de vehiculos
app.get("/obtenerEstadosVeh", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Vehiculo";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar estado de vehiculo:", err);
      res.status(500).json({ error: "Error al buscar estado de vehiculo" });
      return;
    }

    res.json(results);
  });
});

// Ruta PUT para actualizar un registro en la tabla Vehiculo
app.put("/vehiculos/:patente", (req, res) => {
  const patente = req.params.patente;
  const { id_color, estado } = req.body;

  const sql = `UPDATE Vehiculo SET id_color = ?, estado = ? WHERE patente = ?`;
  const values = [id_color, estado, patente];

  // Ejecutar la consulta
  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al ejecutar la consulta:", err);
      res.status(500).send("Error en el servidor.");
    } else {
      res.send("Registro actualizado exitosamente.");
    }
  });
});

app.get("/obtenerTipoVeh", (req, res) => {
  // Consulta SQL
  const query = "SELECT * FROM Tipo_vehiculo";

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al buscar tipos de vehiculo:", err);
      res.status(500).json({ error: "Error al buscar tipos de vehiculo" });
      return;
    }

    res.json(results);
  });
});

// Ruta GET para obtener los datos en formato JSON
app.get("/registroVehiculoPersona", (req, res) => {
  const query = `
    SELECT
      p.rut,
      p.primer_nombre,
      p.primer_apellido,
      p.id_departamento,
      p.id_edificio,
      cr.nombre_conjunto
    FROM
      Persona p
      JOIN Departamento d ON p.id_departamento = d.id_departamento
      JOIN Edificio ed ON d.id_edificio = ed.id_edificio
      JOIN Conjunto_residencial cr ON ed.id_conjunto = cr.id_conjunto
    ORDER BY
      p.primer_apellido ASC;
  `;

  // Ejecutar la consulta
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al ejecutar la consulta: ", err);
      res.status(500).json({ error: "Error al obtener los datos" });
      return;
    }

    // Devolver los resultados en formato JSON
    res.json(results);
  });
});

// Definir una ruta para agregar vehículos (POST /vehiculos)
app.post("/agregarVehiculo", (req, res) => {
  const { patente, id_tipoveh, id_color, estado } = req.body;

  // Realizar la consulta SQL para insertar el vehículo en la tabla
  const query = `INSERT INTO Vehiculo (patente, id_tipoveh, id_color, estado) VALUES (?, ?, ?, ?)`;
  connection.query(
    query,
    [patente, id_tipoveh, id_color, estado],
    (err, result) => {
      if (err) {
        console.error("Error al agregar el vehículo: ", err);
        res
          .status(500)
          .json({ error: "Ocurrió un error al agregar el vehículo." });
        return;
      }

      res.status(200).json({ message: "Vehículo agregado exitosamente." });
    }
  );
});

// Método para agregar un vehículo a la persona en la tabla "Persona_Vehiculo"
app.post("/personaVehiculo", (req, res) => {
  const { rut, patente, id_est } = req.body;

  // Realizar la consulta SQL para insertar el registro en la tabla Persona_Vehiculo
  const query = `INSERT INTO Persona_Vehiculo (rut, patente, id_est) VALUES (?, ?, ?)`;
  connection.query(query, [rut, patente, id_est], (err, result) => {
    if (err) {
      console.error("Error al agregar el vehículo a la persona: ", err);
      res.status(500).json({
        error: "Ocurrió un error al agregar el vehículo a la persona.",
      });
      return;
    }

    res
      .status(200)
      .json({ message: "Vehículo agregado a la persona exitosamente." });
  });
});

//--------------------------------------------------------------------------------------//
// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log("API escuchando en el puerto 3000");
});
app.listen(8100, () => {
  console.log("Servidor escuchando en el puerto 8100");
});
