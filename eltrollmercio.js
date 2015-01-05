Titulares = new Mongo.Collection("titulares");
Mosaicos = new Mongo.Collection("mosaicos");

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("titulares-prueba");
  Meteor.subscribe("mosaicos-prueba");
  
  Template.body.helpers({

    items: function () {
      return Mosaicos.find({}, {sort: {createdAt: -1}}); 
    }
  });

  
  Template.body.events({
    "click .agregar-data": function () {
      Meteor.call("insertNoticias");
    }

  });

  Template.mosaico.events({
    "click .popup-voting": function () {
      // Meteor.call("getMasVotado", this._id);
      Session.set("idNoticia", this._id);

      var h = $(document).height();
      $('#back-cover').toggle();
      $('.voting-container').toggle();
      $('#back-cover').css("height",h);
    }

  });

  Template.mosaico.helpers({
    getMasVotado: function (id) {
      var doc = Titulares.find({idNoticia: id}, {sort: {votos: -1}, limit: 1});//[0].titular;
      var count = 0;
      var titu = ""
      doc.forEach(function (post) {
        titu = post.titular;
      });
      if (titu) {
        return titu;       
      }
      else {
        return "Libre para un titular"
      }

    }
  });

  Template.comments.events({
    "click .borrar": function () {
      Meteor.call("eliminarTitular", this._id);
    },
    "click .upvote": function () {
      Meteor.call("aumentarVoto", this._id);
    },
    "click .downvote": function () {
      Meteor.call("disminuirVoto", this._id);
    }
  });

  Template.comments.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
    puntosUsuario: function(user) {
      var total = 0;
      var result = Titulares.find( { usuario: user } );
      result.forEach(function (doc) {
        total += doc.votos;
      });
      // console.log(total);
      return total;
    }
  }); 

  Template.votaciones.events({
    "submit .nuevo-titular": function (event) {
      // This function is called when the new task form is submitted
      var texto = event.target.textoNuevoTitular.value;

      Meteor.call("addTitular", texto, Session.get("idNoticia"));

      // Clear form
      event.target.textoNuevoTitular.value = "";

      // Prevent default form submit
      return false;
    }
  });

  Template.votaciones.helpers({
    cuantosTitulares: function () {
      return Titulares.find({idNoticia: Session.get("idNoticia")}).count();
    }, 
    titularesPrueba: function () {
      return Titulares.find({idNoticia: Session.get("idNoticia")}, {sort: {votos: -1, createdAt: -1}}); 
    }, 
    getTitular: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({_id: id}).titular;
    },
    getTexto: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({_id: id}).texto;
    },
    getNombreImagen: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({_id: id}).nombreImagen;
    }

  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

Meteor.methods({
  addTitular: function (texto, noticia) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Titulares.insert({
      idNoticia: noticia,
      titular: texto,
      votos: 0,
      createdAt: new Date(),
      owner: Meteor.userId(),
      usuario: Meteor.user().username
    });
  },

  eliminarTitular: function (idTitular) {
    var noticia = Titulares.findOne(idTitular);
    if (Meteor.userId() ==! 'nsoldiac') { //task.private && task.owner !== 
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Titulares.remove(noticia);
  },

  aumentarVoto: function (id) {
    var noticia = Titulares.findOne({_id: id});
    var masVotos = noticia.votos;
    masVotos += 1;
    // console.log("Votos: "+masVotos)

    Titulares.update(
      {_id: id}, 
      {
        $set: {votos : masVotos}
      }
    );
  },

  disminuirVoto: function (id) {
    var noticia = Titulares.findOne({_id: id});
    var menosVotos = noticia.votos;
    if (menosVotos > 0) {
      menosVotos -= 1;
      // console.log("Votos: "+menosVotos)

      Titulares.update(
        {_id: id}, 
        {
          $set: {votos : menosVotos}
        }
      );
    }
  },

  insertNoticias: function () {
    
    Mosaicos.remove({});

    var Document1 = { "categoria" : "Redes Sociales", "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date(), "height" : 99, "idNoticia" : "noticia1", "nombreImagen" : "01.jpg", "positionLeft" : 15, "positionTop" : 7, "texto" : "La animaci&oacute;n de Google recrea las distintas formas de viajar durante las fiestas en Navidad y te desea Felices fiestas", "titular" : "Felices fiestas: Google y su tercer doodle por Navidad", "width" : 176 };
    var Document2 = { "idNoticia" : "noticia2", "titular" : "Facebook: no todos quieren recordar su año en la red social", "texto" : "Cada fin de año, es tradición repasar los momentos vividos. Sin embargo, es necesario que Facebook lo publique?", "categoria" : "Redes Sociales", "nombreImagen" : "02.jpg", "positionTop" : 7, "positionLeft" : 205, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document3 = { "idNoticia" : "noticia3", "titular" : "Mujeres pelean por regalos que peatones dieron a niños", "texto" : "Disputa entre adultos que al parecer exigen a sus hijos pedir limosna fue grabada entre calles Cádiz y Marconi, en San Isidro", "categoria" : "Lima", "nombreImagen" : "03.jpg", "positionTop" : 7, "positionLeft" : 395, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document4 = { "idNoticia" : "noticia4", "titular" : '"Cuatro pasos para salir de pulpín", por Eduardo Morón', "texto" : "Las empresas no buscan trabajadores, sino talento, y cuando lo encuentran esán dispuestos a pagar por retenerlo, dice Morán", "categoria" : "Economía", "nombreImagen" : "04.jpg", "positionTop" : 7, "positionLeft" : 585, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document5 = { "idNoticia" : "noticia5", "titular" : "Editorial: De maduro a rancio", "texto" : "Una vez más, el chavismo consolidó su control en las distintas instituciones del Estado.", "categoria" : "Opinión", "nombreImagen" : "05.jpg", "positionTop" : 7, "positionLeft" : 775, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document6 = { "idNoticia" : "noticia6", "titular" : "Hay más venta de viviendas en Lima norte pese a contracción", "texto" : "Comas, Carabayllo y SMP sintieron la retracción pero tuvieron mejor ritmo debido a los proyectos multifamiliares. <strong>►<span>Vender o alquilar un inmueble: Cuándo es conveniente hacerlo?</span>&nbsp;►►<span>Piensas comprar una vivienda? Descubre lo que más te conviene</strong></span>", "categoria" : "Economía", "nombreImagen" : "06.jpg", "positionTop" : 197, "positionLeft" : 15, "height" : 404, "width" : 556, "class" : "ui-box ui-box3x3 ui-modtop2 ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document7 = { "idNoticia" : "noticia7", "titular" : "Diego Forlán: Chemo me llamó, pero no hay nada con la 'U'", "texto" : "strong>Diego Forlán</strong> confirmó que tiene contrato en Japón, con lo que descartó posible llegada a <strong>Universitario de Deportes</strong>", "categoria" : "Deporte Total", "nombreImagen" : "07.jpg", "positionTop" : 775, "positionLeft" : 15, "height" : 205, "width" : 366, "class" : "ui-box ui-box2x2 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
   
    Mosaicos.insert(Document1);
    Mosaicos.insert(Document2);
    Mosaicos.insert(Document3);
    Mosaicos.insert(Document4);
    Mosaicos.insert(Document5);
    Mosaicos.insert(Document6);
    Mosaicos.insert(Document7);
  }
  
});

if (Meteor.isServer) {

  // Only publish tasks that are public or belong to the current user
  Meteor.publish("titulares-prueba", function () {
    return Titulares.find();
  });

   Meteor.publish("mosaicos-prueba", function () {
    return Mosaicos.find();
  });

}













