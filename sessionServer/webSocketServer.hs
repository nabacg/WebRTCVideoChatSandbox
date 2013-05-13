{-# LANGUAGE OverloadedStrings #-}
import Data.Char (isPunctuation, isSpace)
import Data.Monoid (mappend)
import Control.Monad (forM_, forever)
import Control.Monad.IO.Class (liftIO)
import Control.Exception (fromException)
import Control.Concurrent (MVar, newMVar, modifyMVar_, readMVar)
import Network.WebSockets
import qualified Data.Text as T
import qualified Data.Text.IO as T

type Client = (T.Text, Sink Hybi00)

type ClientList = [Client]

newClientList :: ClientList
newClientList = []

numClients :: ClientList -> Int
numClients = length

clientExists :: Client -> ClientList -> Bool
clientExists client = any ((== fst client) . fst)

addClient :: Client -> ClientList -> ClientList
addClient client clients = client : clients

removeClient :: Client -> ClientList -> ClientList
removeClient client = filter ((/= fst client) . fst)

broadcast :: T.Text -> ClientList -> IO()
broadcast message clients = do
  T.putStrLn message
  forM_ clients $ \(_, sink) -> sendSink sink $ textData message

videoServerApp :: MVar ClientList -> Request -> WebSockets Hybi00 ()
videoServerApp state request = do
  acceptRequest request
  getVersion >>= liftIO . putStrLn . ("Client version: " ++ )
  sink <- getSink
  msg  <- receiveData
  clients <- liftIO $ readMVar state
  case msg of _
                | not(prefix `T.isPrefixOf` msg) -> sendTextData ("Wrong conection attempt" :: T.Text)
                | clientExists client clients -> sendTextData ("User already exists" :: T.Text)
                | otherwise -> do
                  liftIO $ modifyMVar_ state $ \s -> return $ addClient client s
                  talk state client
                where
                  prefix = "UserGuid: "
                  client = (T.drop (T.length prefix) msg, sink)
    

talk :: Protocol p => MVar ClientList -> Client -> WebSockets p ()
talk clients client@(user, _) = flip catchWsError catchDisconnect $
                                forever $ do
                                  msg <- receiveData
                                  liftIO $ do
                                    cl <- readMVar clients
                                    broadcast msg (filter ((/= user) . fst) cl)
                                where
                                  catchDisconnect e = case fromException e of
                                    Just ConnectionClosed -> liftIO $ modifyMVar_ clients $ \s -> do
                                      let s' = removeClient client s
                                      return s'
                                    _ -> return ()

videoServer :: TextProtocol p => WebSockets p ()
videoServer = sendTextData (T.pack "Is this for realz")

videoServerMain :: Request -> WebSockets Hybi00 ()
videoServerMain request = do
  acceptRequest request
  videoServer


main = do
  putStrLn "starting up the server"
  clients <- newMVar newClientList
  runServer "127.0.0.1" 4444 $ videoServerApp clients
