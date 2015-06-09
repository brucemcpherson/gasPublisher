// this demonstrates the use of cJobject.toTreeView() using crest Explorer 
function showRestExplorer() {

  // get known library and show it
  var app = UiApp.createApplication();
  return createRestLibrary().toTreeView( app,"restClick");
}
function restClick(e) {
  var app = UiApp.getActiveApplication();
  Logger.log(JSON.stringify(e));

  return app;

}
function executeRestExplorerQuery() {
  // clicked on a query
  var cj = getRelatedCjobject();
  if (cj) {
    var cr= restQuery(undefined,undefined , TEXT, undefined, URLTEXT,
                      undefined , cj.child("treeSearch").value() , 
                      false, false, undefined, true) ;
    if (cr) { /*
            cbExecute.Caption = "Clear Query"
            trcJobject.Nodes.clear
            */
          var app = UiApp.createApplication();
          ActiveSheet().show(cr.jObject().toTreeView( app));
    }
  }
  else
    showRestExplorer();
}
/*  
  var serverClickHandler = app.createServerClickHandler("testClick");
  var serverKeyHandler = app.createServerKeyHandler('testKeyEvent');
  var serverMouseHandler = app.createServerMouseHandler('testMouseEvent');
  textBox.addKeyPressHandler(serverKeyHandler);
  textBox.addMouseDownHandler(serverMouseHandler);
  button.addClickHandler(serverClickHandler);
  label.addClickHandler(serverClickHandler);
  app.add(button);

Private Function getRelatedCjobject() As cJobject
    Dim s As String, n As Long
    ' bit of a hack.. need to get rid of the root
    If Not trcJobject.SelectedItem Is Nothing Then
        n = InStr(1, trcJobject.SelectedItem.key, ".")
        s = Mid(trcJobject.SelectedItem.key, n + 1)
        Set getRelatedCjobject = createRestLibrary().child(s)
    End If
End Function
Private Sub trcJobject_Click()
    Dim cj As cJobject
    Set cj = getRelatedCjobject
    'now we should have the right entry
    
    If (Not cj Is Nothing) Then
        If (Not cj.child("url") Is Nothing) Then tbURL.Text = cj.child("url").toString
    End If
End Sub

Private Sub trcJobject_NodeCheck(ByVal node As MSComctlLib.node)
    ' if we get here then a check has been set on on or off..
    ' all the children need to inherit this
    grantParentNodeCheck node, node.Checked
End Sub
Private Sub grantParentNodeCheck(parent As MSComctlLib.node, _
                        Optional check As Boolean = True)
    Dim child As MSComctlLib.node
    parent.Checked = check
    Set child = parent.child
    While Not child Is Nothing
        grantParentNodeCheck child, check
        Set child = child.Next
    Wend
End Sub
Private Sub UserForm_Initialize()
    userformExampleRestLibrary
End Sub

Private Sub userformExampleAdo()
    Dim ado As New cADO
    ado.init(Range("testado!a1")).execute("tweetsentiments", _
            , "where value=1").dSet.jObject.toTreeView trcJobject
End Sub

Private Sub userformExampleRestLibrary()
    createRestLibrary().toTreeView trcJobject
End Sub
Private Sub userformExampleRestTest()
    Dim cr As New cRest, dSet As New cDataSet
    Set cr = restQuery(, "twitter", "hat", , , , , False, False, , True)
    cr.jObject.toTreeView trcJobject

End Sub
*/