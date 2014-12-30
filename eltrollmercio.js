Titulares = new Mongo.Collection("titulares");

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("titulares");
  
  Template.body.helpers({
    comments: function () {
      return Titulares.find({type: "noticia1"}, {sort: {createdAt: -1}}); 
    },
    cuantosTitulares: function () {
      return Titulares.find({type: "noticia1"}).count();//{checked: {$ne: true}}).count();
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

  Template.comments.events({
    "click .borrar": function () {
      Meteor.call("eliminarTitular", this._id);
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
      createdAt: new Date(),
      owner: Meteor.userId(),
      usuario: Meteor.user().username
    });
  },

  eliminarTitular: function (taskId) {
    var task = Titulares.findOne(taskId);
    if (Meteor.userId() ==! 'nsoldiac') { //task.private && task.owner !== 
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }

    Titulares.remove(taskId);
  }
  
});

if (Meteor.isServer) {

  // Only publish tasks that are public or belong to the current user
  Meteor.publish("titulares", function () {
    return Titulares.find(
      //
    );
  });

  /*
  Meteor.publish("emails", function () {
    return Titulares.find(
      // {type: "email"},
      {$or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]}
    );
  });
*/

}







