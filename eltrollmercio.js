Titulares = new Mongo.Collection("titulares");
Mosaicos = new Mongo.Collection("mosaicos");

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("titulares-prueba");
  Meteor.subscribe("mosaicos-prueba");
  
  Template.body.helpers({
    titularesPrueba: function () {
      return Titulares.find({idNoticia: "noticia1"}, {sort: {votos: -1, createdAt: -1}}); 
    },
    items: function () {
      return Mosaicos.find({}, {sort: {votos: -1, createdAt: -1}}); 
    },
    cuantosTitulares: function () {
      return Titulares.find({idNoticia: "noticia1"}).count();//{checked: {$ne: true}}).count();
    }, 
    puntosUsuario: function() {
      var result = Titulares.aggregate( [
        {
          $group: {
            _id: null,
            total: {$sum: "$votos"}
          }
        }
      ] );

      console.log(result.votos);
      return result;
    }
  });

  Template.body.events({
    "submit .nuevo-titular": function (event) {
      // This function is called when the new task form is submitted
      var texto = event.target.textoNuevoTitular.value;

      Meteor.call("addTitular", texto, "noticia1");

      // Clear form
      event.target.textoNuevoTitular.value = "";

      // Prevent default form submit
      return false;
    }

  });

  Template.mosaico.events({
    "click .popup-voting": function () {
      Meteor.call("renderVotingTemplate", this._id);

      var h = $(document).height();
      $('#back-cover').toggle();
      $('.voting-container').toggle();
      $('#back-cover').css("height",h);
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

  renderVotingTemplate: function (noticia) {
    var record = Mosaicos.findOne({
      _id: noticia
    });
    var titulo = record.titular;
    var texto = record.texto;
    var imagen = record.nombreImagen;

    // Code to render the variables above into the voting popup window
  }
  
});

if (Meteor.isServer) {

  // Only publish tasks that are public or belong to the current user
  Meteor.publish("titulares-prueba", function () {
    return Titulares.find(
      // {idNoticia: "noticia1"}
    );
  });

   Meteor.publish("mosaicos-prueba", function () {
    return Mosaicos.find();
  });

}


// db.mosaicos.insert(
//   {
//   "idNoticia" : "noticia2",
//   "titular" : "Facebook: no todos quieren recordar su año en la red social",
//   "texto": "Cada fin de año, es tradició;n repasar los momentos vividos. Sin embargo, es necesario que Facebook lo publique?",
//   "categoria" : "Redes Sociales",
//   "nombreImagen": "02.jpg",
//   "positionTop": 7,
//   "positionLeft": 205,
//   "height": 99,
//   "width": 176,
//   "class": "ui-box ui-box1x1 ui-modleft ui-tiponota popup-voting",
//   "createdAt" : new Date()
// })






