Titulares = new Mongo.Collection("titulares");
Mosaicos = new Mongo.Collection("mosaicos");
Leaders = new Mongo.Collection("leaders");

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("titulares-prueba");
  Meteor.subscribe("mosaicos-prueba");
  Meteor.subscribe("leaderboard");
  
  Template.body.helpers({
    items: function () {
      return Mosaicos.find({}, {sort: {createdAt: -1}, limit: 16}); 
    },
    topLeaders: function () {
      return Leaders.find({}, {sort: {puesto: 1}, limit: 10}); 
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
    puntos: function () {
     var total = 0;
      var result = Titulares.find( { owner: Meteor.userId() } );
      result.forEach(function (doc) {
        total += doc.votos * 7;
        total += 1;
      });
      return total + " ptos.";
    },
    desdeCuando: function () {
      var origin = new Date("2014/12/26");
      var current = new Date();
      var total = Number( (current - origin) / 31536000000 );
      total = Math.round(total * 100) / 100;

      return total;
    },
    isAdmin: function () {
      var admins = ['nsoldiac', 'elcoordi', 'arturodr'];
      var user = Meteor.user().username;
      if (admins.indexOf(user) >= 0) {
        return true;
      } else {
        return false;
      }
    }
  });

  Template.body.events({
    "click .agregar-data": function () {
      Meteor.call("clearNoticias");
    },
    "click .html-get": function () {
      Meteor.call("httpGetCall");
    },
    "click .m-placeholder, click .titulares-user": function () {
      window.alert("En porceso de construcción...");

    },
    "click div.leaderboard>table>tr:first-child": function () {
      // window.alert("So far so good");
      if (Meteor.user().username == 'nsoldiac'){
        Meteor.call("recalculateLeaderboard");
        console.log(returnAdmins);
        console.log("termine");
      }
    }
  });

  Template.mosaico.events({
    "click .popup-voting": function () {
      Session.set("idNoticia", this.idNoticia);

      var h = $(document).height();
      $('#back-cover').toggle();
      $('.voting-container').toggle();
      $('#back-cover').css("height",h);
    }
  });

  Template.mosaico.helpers({
    getMasVotado: function (id) {
      var doc = Titulares.find({idNoticia: id}, {sort: {votos: -1, createdAt: -1}, limit: 1});
      var count = 0;
      var titu = "";
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
        total += doc.votos * 7;
        total += 1;
      });
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
      return Mosaicos.findOne({idNoticia: id}).titular;
    },
    getTexto: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({idNoticia: id}).texto;
    },
    getNombreImagen: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({idNoticia: id}).nombreImagen;
    },
    getLink: function () {
      var id = Session.get("idNoticia");
      return Mosaicos.findOne({idNoticia: id}).idNoticia;
    }

  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Meteor.startup(function() {
    $(document).ready(function() {
        // show google analytics if running on the live web site
        if ( -1 != document.URL.indexOf("http://eltrollmercio.com/") )
        {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

          ga('create', 'UA-21812321-3', 'auto');
          ga('send', 'pageview');
        }
    });
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

  clearNoticias: function () {
    
    Mosaicos.remove({});
    Titulares.remove({});
   
  }
});

if (Meteor.isServer) {

/*
  Npm.depends({cheerio: "0.18.0"});
*/
  // Only publish tasks that are public or belong to the current user
  Meteor.publish("titulares-prueba", function () {
    return Titulares.find();
  });

   Meteor.publish("mosaicos-prueba", function () {
    return Mosaicos.find();
  });

   Meteor.publish("leaderboard", function () {
    return Leaders.find();
  });

  // HTTP call and parsing section
  var request = Npm.require('request');

  Meteor.methods({

    httpGetCall: function () {
        var getContent = HTTP.call("GET",'http://elcomercio.pe');
        var cheerio = Npm.require('cheerio'),
          $ = cheerio.load(getContent.content);
        var link = [],
            clase = [],
            style = "",
            titular = [],
            categoria = [],
            texto = [],
            imgURL = [],
            imgHeight = [],
            imgWidgth = [];

        // console.log(clase);

        $('article.ui-box').each(function(i, elem) {
          link[i] = $(this).find('figure > figcaption > h2 > a').attr('href');
          clase[i] = $(this).attr('class');
          titular[i] = $(this).find('figure > figcaption > h2 > a').text();
          categoria[i] = $(this).find('figure > figcaption > h3 > a').text();
          texto[i] = $(this).find('figure > figcaption > p').text();
          imgURL[i] = $(this).find('figure > a > img').attr('src');
          imgHeight[i] = $(this).find('figure > a > img').attr('height');
          imgWidgth[i] = $(this).find('figure > a > img').attr('width');
        });

        var box1x1 = [
            "position: absolute; top: 7px; left: 15px;",
            "position: absolute; top: 7px; left: 205px;",
            "position: absolute; top: 7px; left: 395px;",
            "position: absolute; top: 7px; left: 585px;",
            "position: absolute; top: 7px; left: 775px;",
            "position: absolute; top: 775px; left: 395px;",
            "position: absolute; top: 775px; left: 585px;",
            "position: absolute; top: 775px; left: 775px;",
            "position: absolute; top: 965px; left: 395px;",
            "position: absolute; top: 1155px; left: 15px;",
            "position: absolute; top: 1155px; left: 205px;",
            "position: absolute; top: 1155px; left: 395px;"
            ],
            box2x2 = [
            "position: absolute; top: 775px; left: 15px;",
            "position: absolute; top: 965px; left: 585px;"
            ],
            box3x3 = "position: absolute; top: 197px; left: 15px;",
            b1x1 = 0,
            b2x2 = 0;

        for (i = 0; i < 16; i++) {
          // console.log(clase[i])
          if (clase[i].indexOf("ui-box1x1") >= 0) {
            style = box1x1[b1x1];
            b1x1 += 1;
          } else if (clase[i].indexOf("ui-box2x2") >= 0) {
            style = box2x2[b2x2];
            b2x2 += 1;
          } else if (clase[i].indexOf("ui-box3x3") >= 0) {
            style = box3x3;
          } else {
            style = "display: none;"
          }
          console.log(i + ". " + titular[i]);
          console.log(style);
          console.log(clase[1] + "\n");

          Mosaicos.insert({ 
            "idNoticia" : link[i], 
            "titular" : titular[i], 
            "texto" : texto[i], 
            "categoria" : categoria[i], 
            "nombreImagen" : imgURL[i], 
            "height" : imgHeight[i], 
            "width" : imgWidgth[i], 
            "class" : clase[i] + " popup-voting", 
            "style" : style, 
            "createdAt" : new Date()
          }); 

        }

      },
      recalculateLeaderboard: function() {
        Leaders.remove({});

        var points = 0;
        var titus = Titulares.find();

        titus.forEach(function (doc) {
          points = 0;
          var own = doc.ownerName;
          if ( Leaders.find({usuario: own}).count() == 0 ) {
            points = doc.votos * 7;
            Leaders.insert(
              {
                puesto: 0,
                usuario: own,
                puntos: points + 1
              }
            )
          } else if ( Leaders.find({usuario: own}).count() > 0 ){
            points = Leaders.findOne({usuario: own}).puntos;
            points += doc.votos * 7;
            points += 1

            Leaders.update(
              {usuario: own},
              {$set: {puntos: points}}
            );
            // console.log(doc.ownerName + " - " + doc.titular + " - votos: " + doc.votos);
          } else {
            console.log("Something unexpected happened");
          }

          var p = 1;
          Leaders.find({}, {sort: {puntos: -1}}).forEach(function (post) {
            Leaders.update({usuario: post.usuario}, {$set: {puesto: p}});
            p += 1;
            // console.log("p: " + p);
          });
        });
        
      }

  }); 

  var foo = function () {
      console.log('Ran \"recalculateLeaderboard\"');
      Meteor.call("recalculateLeaderboard");
    }

  var bar = function () {
      console.log('Ran \"recalculateLeaderboard\"');
      Meteor.call("httpGetCall");
    }

  var cron = new Meteor.Cron( {
    events:{
      "0 * * * *"  : foo,
      "*/15 2-14 * * *" : bar
    }
  });

}













