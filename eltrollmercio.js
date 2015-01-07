Titulares = new Mongo.Collection("titulares");
Mosaicos = new Mongo.Collection("mosaicos");

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("titulares-prueba");
  Meteor.subscribe("mosaicos-prueba");
  
  Template.body.helpers({
    items: function () {
      return Mosaicos.find({}, {sort: {createdAt: -1}}); 
    },
    fecha: function () {
      var date = new Date();
      var d = date.getDate();
      var m = date.getMonth();
      var y = date.getFullYear();

      var months = new Array();
      months[0] = "enero";
      months[1] = "febrero";
      months[2] = "marzo";
      months[3] = "abril";
      months[4] = "mayo";
      months[5] = "junio";
      months[6] = "julio";
      months[7] = "agosto";
      months[8] = "setiembre";
      months[9] = "octubre";
      months[10] = "noviembre";
      months[11] = "diciembre";

      var todo = d + " de " + months[m] + " del " + y;
      return todo;
    },
    puntos: function (user) {
      var total = 0;
      var result = Titulares.find( { owner: Meteor.userId() } );
      result.forEach(function (doc) {
        total += doc.votos;
      });

      return total + " ptos.";
    },
    desdeCuando: function () {
      var origin = new Date("2014/12/26");
      var current = new Date();
      var total = Number( (current - origin) / 31536000000 );
      total = Math.round(total * 100) / 100;

      return total;
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
        return "[libre para tu titular]"
      }

    }
  });

  Template.comments.events({
    "click .borrar": function () {
      if (! Meteor.userId()) {
        window.alert("Si no estas logueado no puedes aportar :(");
        throw new Meteor.Error("not-authorized");
      }
      else if (Meteor.userId() !== this.owner) {
        window.alert("No puedes borrar posts que no sean tuyos pes causa");
        throw new Meteor.Error("not-authorized");
      }
      Meteor.call("eliminarTitular", this._id);
    },
    "click .upvote, click .upvoteClicked": function () {
      if (! Meteor.userId()) {
        window.alert("Si no estas logueado no puedes aportar :(");
        throw new Meteor.Error("not-authorized");
      }
      Meteor.call("aumentarVoto", this._id, Meteor.user().username);
    },

    "click .downvote, click .downvoteClicked": function () {
      if (! Meteor.userId()) {
        window.alert("Si no estas logueado no puedes aportar :(");
        throw new Meteor.Error("not-authorized");
      }
      Meteor.call("disminuirVoto", this._id, Meteor.user().username);
    }
  });

  Template.comments.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
    puntosUsuario: function(user) {
      var total = 0;
      var result = Titulares.find( { owner: user } );
      result.forEach(function (doc) {
        total += doc.votos;
      });
      // console.log(total);
      return total;
    },
    upV: function (id) {
      var upVoters = Titulares.findOne({_id: id}).usuariosUpvoters;

      if ( upVoters.indexOf(Meteor.user().username) >= 0 ) {
        return "upvoteClicked";
      }
      else {
        return "upvote";
      }
    },
    downV: function (id) {
      var upVoters = Titulares.findOne({_id: id}).usuariosDownvoters;

      if ( upVoters.indexOf(Meteor.user().username) >= 0 ) {
        return "downvoteClicked";
      }
      else {
        return "downvote";
      }
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
      window.alert("Si no estas logueado no puedes aportar :(");
      throw new Meteor.Error("not-authorized");
    }
    else if (texto == "") {
      return false;
    }

    // console.log(Meteor.username);

    Titulares.insert({
      idNoticia: noticia,
      titular: texto,
      votos: 0,
      createdAt: new Date(),
      owner: Meteor.userId(),
      ownerName: Meteor.user().username,
      usuariosUpvoters: [],
      usuariosDownvoters: []
    });
  },

  eliminarTitular: function (idTitular) {
    var noticia = Titulares.findOne(idTitular);

    if (Meteor.userId() ==! 'nsoldiac') { 
      throw new Meteor.Error("not-authorized");
    }

    Titulares.remove(noticia);
  },

  aumentarVoto: function (id, userid) {
    var noticia = Titulares.findOne({_id: id});
    var votantesUp = noticia.usuariosUpvoters;
    var votantesDown = noticia.usuariosDownvoters;
    var masVotos = noticia.votos;
    
    if ( votantesDown.indexOf(userid) >= 0 ) {
      Titulares.update(
        {_id: id}, 
        {$pull: {usuariosDownvoters: userid}}
      );
      if (masVotos !== 0) {
        masVotos += 1;
        Titulares.update(
          {_id: id}, 
          {$set: {votos : masVotos}}
        );
      }
    }
    
    if ( votantesUp.indexOf(userid) < 0 ) {
      masVotos += 1;
      Titulares.update(
        {_id: id}, 
        {$set: {votos : masVotos}}
      );
      Titulares.update(
        {_id: id}, 
        {$push: {usuariosUpvoters: userid}}
      );
    } else if ( votantesUp.indexOf(userid) >= 0 ) {
      Titulares.update(
        {_id: id}, 
        {$pull: {usuariosUpvoters: userid}}
      );
      masVotos -= 1;
      Titulares.update(
        {_id: id}, 
        {$set: {votos : masVotos}}
      );
    }
  },

  disminuirVoto: function (id, userid) {
    var noticia = Titulares.findOne({_id: id});
    var votantesUp = noticia.usuariosUpvoters;
    var votantesDown = noticia.usuariosDownvoters;
    var menosVotos = noticia.votos;

    if ( votantesUp.indexOf(userid) >= 0 ) {
      Titulares.update(
        {_id: id}, 
        {$pull: {usuariosUpvoters: userid}}
      );
      if (menosVotos > 0) {
        menosVotos -= 1;
        Titulares.update(
          {_id: id}, 
          {$set: {votos : menosVotos}}
        );
      }
    }

    if ( votantesDown.indexOf(userid) < 0 ) {
      if (menosVotos > 0) {
        menosVotos -= 1;
        Titulares.update(
          {_id: id}, 
          {$set: {votos : menosVotos}}
        );
      }
      Titulares.update(
        {_id: id}, 
        {$push: {usuariosDownvoters: userid}}
      );
    } else if ( votantesDown.indexOf(userid) >= 0 ) {
      Titulares.update(
        {_id: id}, 
        {$pull: {usuariosDownvoters: userid}}
      );
      if (menosVotos > 0) {
        menosVotos += 1;
          Titulares.update(
            {_id: id}, 
            {$set: {votos : menosVotos}}
          );
      }
    }
  },

  insertNoticias: function () {
    
    Mosaicos.remove({});
    Titulares.remove({});

    var Document1 = { "categoria" : "Redes Sociales", "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date(), "height" : 99, "idNoticia" : "noticia1", "nombreImagen" : "01.jpg", "positionLeft" : 15, "positionTop" : 7, "texto" : "La animación de Google recrea las distintas formas de viajar durante las fiestas en Navidad y te desea Felices fiestas", "titular" : "Felices fiestas: Google y su tercer doodle por Navidad", "width" : 176 };
    var Document2 = { "idNoticia" : "noticia2", "titular" : "Facebook: no todos quieren recordar su año en la red social", "texto" : "Cada fin de año, es tradición repasar los momentos vividos. Sin embargo, es necesario que Facebook lo publique?", "categoria" : "Redes Sociales", "nombreImagen" : "02.jpg", "positionTop" : 7, "positionLeft" : 205, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document3 = { "idNoticia" : "noticia3", "titular" : "Mujeres pelean por regalos que peatones dieron a niños", "texto" : "Disputa entre adultos que al parecer exigen a sus hijos pedir limosna fue grabada entre calles Cádiz y Marconi, en San Isidro", "categoria" : "Lima", "nombreImagen" : "03.jpg", "positionTop" : 7, "positionLeft" : 395, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document4 = { "idNoticia" : "noticia4", "titular" : '"Cuatro pasos para salir de pulpín", por Eduardo Morón', "texto" : "Las empresas no buscan trabajadores, sino talento, y cuando lo encuentran esán dispuestos a pagar por retenerlo, dice Morán", "categoria" : "Economía", "nombreImagen" : "04.jpg", "positionTop" : 7, "positionLeft" : 585, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document5 = { "idNoticia" : "noticia5", "titular" : "Editorial: De maduro a rancio", "texto" : "Una vez más, el chavismo consolidó su control en las distintas instituciones del Estado.", "categoria" : "Opinión", "nombreImagen" : "05.jpg", "positionTop" : 7, "positionLeft" : 775, "height" : 99, "width" : 176, "class" : "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document6 = { "idNoticia" : "noticia6", "titular" : "Hay más venta de viviendas en Lima norte pese a contracción", "texto" : "Comas, Carabayllo y SMP sintieron la retracción pero tuvieron mejor ritmo debido a los proyectos multifamiliares. ►Vender o alquilar un inmueble: Cuándo es conveniente hacerlo? ►► Piensas comprar una vivienda? Descubre lo que más te conviene", "categoria" : "Economía", "nombreImagen" : "06.jpg", "positionTop" : 197, "positionLeft" : 15, "height" : 404, "width" : 556, "class" : "ui-box ui-box3x3 ui-modtop2 ui-tiponota popup-voting", "createdAt" : new Date()};
    var Document7 = { "idNoticia" : "noticia7", "titular" : "Diego Forlán: Chemo me llamó, pero no hay nada con la 'U'", "texto" : "Diego Forlán confirmó que tiene contrato en Japón, con lo que descartó posible llegada a Universitario de Deportes", "categoria" : "Deporte Total", "nombreImagen" : "07.jpg", "positionTop" : 775, "positionLeft" : 15, "height" : 205, "width" : 366, "class" : "ui-box ui-box2x2 ui-modleft ui-tiponota popup-voting", "createdAt" : new Date()};
   
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

  var cheerio = Npm.require('cheerio'),
    $ = cheerio.load(HTTP.call('GET', 'news.ycombinator.com'));

  // Meteor.methods({
  //   getMethods: function (obj) {
  //     var result = [];
  //     for (var id in obj) {
  //       try {
  //         if (typeof(obj[id]) == "function") {
  //           result.push(id + ": " + obj[id].toString());
  //         }
  //       } catch (err) {
  //         result.push(id + ": inaccessible");
  //       }
  //     }
  //     return result;
  //   },
  //   checkYCnews: function () {
  //     this.unblock();
  //     try {
  //       var result = HTTP.call("GET", "http://www.google.com");
  //       console.log(Meteor.call("getMethods(result)"));
  //       return true;
  //     } catch (e) {
  //       // Got a network error, time-out or HTTP error in the 400 or 500 range.
  //       return false;
  //     }
  //   }
  // });   

  // console.log("THIS IS FROM THE SERVER CODE!");
  
  // // var result = HTTP.call("GET", "http://www.google.com");
  // Meteor.call("checkYCnews");

}













