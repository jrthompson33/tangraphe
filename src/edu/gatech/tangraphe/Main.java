package edu.gatech.tangraphe;

import javafx.application.Application;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Rectangle2D;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Menu;
import javafx.scene.control.MenuBar;
import javafx.scene.control.MenuItem;
import javafx.scene.input.*;
import javafx.scene.layout.BorderPane;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Screen;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

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
        _initTouchHandlers();

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

//        mWebEngine.getLoadWorker().stateProperty().addListener()
//        {
            JSObject window = (JSObject) mWebEngine.executeScript("window");
            JavaBridge bridge = new JavaBridge();
            window.setMember("java", bridge);
            mWebEngine.executeScript("console.log = function(message)\n" +
                    "{\n" +
                    "    java.log(message);\n" +
                    "};");
//        });
    }

    private void _initMenuBar() {
        mMenuBar = new MenuBar();
        mFileMenu = new Menu("File");
        mRefreshMenuItem = new MenuItem("Refresh");
        mRefreshMenuItem.setOnAction(new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                mWebEngine.reload();
            }
        });

//        mFileMenu.getItems().add(mRefreshMenuItem);

//        mMenuBar.getMenus().add(mFileMenu);
    }

    private void _initTouchHandlers() {
        mWebView.onTouchMovedProperty().set(_touchHandler);
        mWebView.onTouchPressedProperty().set(_touchHandler);
        mWebView.onTouchReleasedProperty().set(_touchHandler);
        mWebView.onTouchStationaryProperty().set(_touchHandler);
        mWebView.onZoomStartedProperty().set(_zoomHandler);
        mWebView.onZoomProperty().set(_zoomHandler);
        mWebView.onZoomFinishedProperty().set(_zoomHandler);
        mWebView.onScrollStartedProperty().set(_scrollHandler);
        mWebView.onScrollProperty().set(_scrollHandler);
        mWebView.onScrollFinishedProperty().set(_scrollHandler);
        mWebView.onMouseClickedProperty().set(_mouseHandler);
        mWebView.onMousePressedProperty().set(_mouseHandler);
        mWebView.onMouseReleasedProperty().set(_mouseHandler);
        mWebView.onMouseMovedProperty().set(_mouseHandler);
        mWebView.onSwipeDownProperty().set(_swipeHandler);
        mWebView.onSwipeUpProperty().set(_swipeHandler);
        mWebView.onSwipeLeftProperty().set(_swipeHandler);
        mWebView.onSwipeRightProperty().set(_swipeHandler);
    }

    private EventHandler<TouchEvent> _touchHandler = new EventHandler<TouchEvent>() {
        @Override
        public void handle(TouchEvent event) {
            int touchId = event.getTouchCount();


        }
    };

    private EventHandler<ZoomEvent> _zoomHandler = new EventHandler<ZoomEvent>() {
        @Override
        public void handle(ZoomEvent event) {

        }
    };

    private EventHandler<ScrollEvent> _scrollHandler = new EventHandler<ScrollEvent>() {
        @Override
        public void handle(ScrollEvent event) {

        }
    };

    private EventHandler<MouseEvent> _mouseHandler = new EventHandler<MouseEvent>() {
        @Override
        public void handle(MouseEvent event) {
            event.getClickCount();
            event.getEventType();
            event.getSceneX();
            event.getSceneY();
            event.isDragDetect();
            event.isMetaDown();
            event.isPrimaryButtonDown();
            event.isSecondaryButtonDown();
            event.isShiftDown();
            mWebEngine.executeScript("main.mouseEvent("+event.getSceneX()+","+event.getSceneY()+",\""+event.getEventType().toString()+"\");");
        }
    };

    private EventHandler<SwipeEvent> _swipeHandler = new EventHandler<SwipeEvent>() {
        @Override
        public void handle(SwipeEvent event) {

        }
    };

    public class JavaBridge {
        public void log(String text) {
            System.out.println(text);
        }
    }


}
