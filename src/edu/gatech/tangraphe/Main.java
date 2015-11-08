package edu.gatech.tangraphe;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Rectangle2D;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuBar;
import javafx.scene.control.MenuItem;
import javafx.scene.layout.BorderPane;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Screen;
import javafx.stage.Stage;

import java.io.File;
import java.nio.file.Paths;

public class Main extends Application {

    private static MenuBar mMenuBar;
    private static Menu mFileMenu;
    private static MenuItem mRefreshMenuItem;

    private static Menu mEditMenu;
    private static MenuItem mUndoMenuItem;
    private static MenuItem mRedoMenuItem;

    private static Menu mViewMenu;
    private static MenuItem mZoomMenuItem;

    private static File mDataPath;

    private static Stage mStage;
    private static Scene mScene;
    private static WebView mWebView;
    private static WebEngine mWebEngine;

    // TODO update this with RSKETCH_HOME and create file name from that
    private static final String mHtmlFilePath = Paths.get(".", "html", "index.html").toUri().toString();

    @Override
    public void start(Stage primaryStage) throws Exception{
        mStage = primaryStage;

        // Set up the Parent root for the stage
        BorderPane root = new BorderPane();
        primaryStage.setTitle("Tangraphe");

        // initialize the menu & view
        _initMenuBar();
        _initWebView();

        // Expand the application to be the full size of the screen
        // TODO save the previous size of the screen application
        Screen screen = Screen.getPrimary();
        Rectangle2D bounds = screen.getVisualBounds();
        primaryStage.setX(0);
        primaryStage.setY(0);
        primaryStage.setWidth(bounds.getWidth());
        primaryStage.setHeight(bounds.getHeight());
        mScene = new Scene(root);

        root.setTop(mMenuBar);
        root.setCenter(mWebView);
        primaryStage.setScene(mScene);
        primaryStage.show();
    }


    public static void main(String[] args) {
        launch(args);
    }


    private void _initWebView() {
        mWebView = new WebView();
        mWebView.setContextMenuEnabled(false);
        mWebEngine = mWebView.getEngine();

        mWebEngine.load(mHtmlFilePath);
    }

    private void _initMenuBar() {
        mMenuBar = new MenuBar();
        mFileMenu = new Menu("File");
    }

}
